Module.register("MMM-wiki",{
	  defaults: {
        updateInterval: 30000,
		    language: "en",
        characterLimit: 500,
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
        ]
	  },

    availableArticles: [],

    validArticle: function(jsonArticle) {
        function containsBadWords(text, badList) {
            return badList.map(word => word.toLowerCase())
                .some(badWord => text.toLowerCase().indexOf(badWord) >= 0);
        }

        return ('pageid' in jsonArticle)
            && ('title' in jsonArticle)
            && ('extract' in jsonArticle)
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
        if (!('query' in json) || !('pages' in json.query)) {
            return fetchedArticles;
        }
        for (let pageid in json.query.pages) {
            if (json.query.pages.hasOwnProperty(pageid)) {
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
        }
        return fetchedArticles;
    },

    fillArticles: function() {
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

        const url =  'https://' + this.config.language + '.wikipedia.org/w/api.php?' +
              Object.keys(params).map(
                  key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key])).join('&');
        fetch(url)
            .then(response => response.json())
            .then(content => {
		            this.availableArticles.push(...this.extractArticles(content));
                this.availableArticles.sort((a, b) => a.views > b.views);
                this.availableArticles = this.availableArticles.slice(0, 200);
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
		    return wrapper;
	  },

    start: function() {
	      var self = this;
	      setInterval(function() {
		        self.updateDom(500);
	      }, self.config.updateInterval);
    },
});
