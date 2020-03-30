Module.register("MMM-wiki",{
    defaults: {
        updateInterval: 30000,
        language: "en",
        characterLimit: 500,
        category: undefined,
        badTitles: [
            "Graphical",
            "timeline",
            "List"
        ],
        badContents: [
            "This article",
            "See also",
            "redirects here",
            "The following outline",
            "may refer to"
        ],
        maxWidth: '50%',
        margin: '0 auto',
	fontSize: '24px',
	lineHeight: '24px'
    },

    availableArticles: [],

    get: function(func) {
        try {
            const value = func();
            return (value === null || value === undefined) ? null : value;
        } catch (e) {
            return null;
        }
    },

    validArticle: function(jsonArticle) {
        function containsBadWords(text, badList) {
            return badList
                .map(word => word.toLowerCase())
                .some(badWord => text.toLowerCase().indexOf(badWord) >= 0);
        }

        return 'pageid' in jsonArticle
            && 'title' in jsonArticle
            && 'extract' in jsonArticle
            && jsonArticle.extract.length > 100
            && jsonArticle.ns === 0
            && !containsBadWords(jsonArticle.title, this.config.badTitles)
            && !containsBadWords(jsonArticle.extract, this.config.badContents);
    },

    getContent: function(extract) {
        const wrapper = document.createElement('wrapper');
        wrapper.innerHTML = extract;
        const content = document.createElement('content');
        for (let i = 0; i < wrapper.childNodes.length; ++i) {
            if (content.textContent.length +
                wrapper.childNodes[i].textContent.length < this.config.characterLimit) {
                if (wrapper.childNodes[i].textContent.trim().length > 0) {
                    content.appendChild(wrapper.childNodes[i]);
                }
            } else {
                return content;
            }
        }
        return content;
    },

    extractArticles: function(json) {
        const fetchedArticles = [];
        if (!this.get(() => json.query.pages)) {
            return fetchedArticles;
        }
        for (let pageid in json.query.pages) {
            if (!json.query.pages.hasOwnProperty(pageid)) {
                break;
            }
            const jsonArticle = json.query.pages[pageid];
            if (!this.validArticle(jsonArticle)) {
                continue;
            }
            const articleContent = this.getContent(jsonArticle.extract);
            const article =  articleContent.innerHTML.length > 0 ? {
                content: articleContent.innerHTML,
                views: 0
            } : null;
            if (article) {
                fetchedArticles.push(article);
            }
        }
        return fetchedArticles;
    },

    extractDidyouKnowItems: function(json) {
        if (!this.get(() => json.query.pages)) {
            return [];
        }
        for (let pageid in json.query.pages) {
            const jsonItems = this.get(() => json.query.pages[pageid].extract);
            if (!jsonItems) {
                break;
            }
            return jsonItems
                .match(/\.\.\. .*?\?/g)
                .map(item => item
                     .replace(/^\.\.\./g, 'Did you know') // replace ... with Did you know at the beginning
                     .replace('(pictured)', '')) // remove pictured
                .filter(item => item.length > 0)
                .map(item => ({
                    content: item,
                    views: 0
                }));

        }
        return [];
    },

    getFetchParams: function(params) {
        return Object.keys(params)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
    },

    getRandomFetchUrl: function() {
        const params = {
            format: 'json',
            action: 'query',
            prop: 'extracts',
            exlimit: 'max',
            exintro: '',
            piprop:'original',
            pilimit: 'max',
            generator: 'random',
            origin: '*',
            grnnamespace: '0',
            grnlimit: '100'
        };

        return 'https://' + this.config.language + '.wikipedia.org/w/api.php?' + this.getFetchParams(params);
    },

    getDidYouKnowUrl: function() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December" ];
        const randomMonth = monthNames[Math.floor(Math.random() * monthNames.length)];
        const currentYear = new Date().getFullYear();
        const randomYear = Math.floor(Math.random() * (currentYear - 2005 + 1) + 2005);
        const params = {
            format: 'json',
            action: 'query',
            prop: 'extracts',
            rvprop: 'content',
            rvslots: '*',
            titles:'Wikipedia:Recent additions/' + randomYear + '/' + randomMonth,
            origin: '*'
        };

        return 'https://en.wikipedia.org/w/api.php?' + this.getFetchParams(params);
    },

    fillArticles: function() {
        const url = this.config.category === 'DidYouKnow'
              ? this.getDidYouKnowUrl() : this.getRandomFetchUrl();
        fetch(url)
            .then(response => response.json())
            .then(content => {
                const items = this.config.category === 'DidYouKnow'
                      ? this.extractDidyouKnowItems(content) : this.extractArticles(content);
                this.availableArticles.push(...items);
                this.availableArticles.sort((a, b) => a.views > b.views);
                this.availableArticles = this.availableArticles.slice(0, 2000);
                this.updateDom(500);
            });
    },

    getDom: function() {
        const article = this.availableArticles.reduce(
            (prev, current) => (prev.views < current.views) ? prev : current,
            {content: 'No articles fetched', views: 1000});
        if (article.views > 0) {
            console.log('Fetching new articles');
            this.fillArticles();
        }
        var wrapper = document.createElement("div");
        article.views++;
        wrapper.innerHTML = article.content;
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;
        wrapper.style.margin = this.config.margin;
        wrapper.style.fontSize= this.config.fontSize;
        wrapper.style.lineHeight= this.config.lineHeight;
        return wrapper;
    },

    start: function() {
        var self = this;
        setInterval(function() {
            self.updateDom(500);
        }, self.config.updateInterval);
    },
});
