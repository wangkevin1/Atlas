/*  
 *            $$\     $$\
 *            $$ |    $$ |
 *  $$$$$$\ $$$$$$\   $$ | $$$$$$\   $$$$$$$\
 *  \____$$\\_$$  _|  $$ | \____$$\ $$  _____|
 *  $$$$$$$ | $$ |    $$ | $$$$$$$ |\$$$$$$\
 * $$  __$$ | $$ |$$\ $$ |$$  __$$ | \____$$\
 * \$$$$$$$ | \$$$$  |$$ |\$$$$$$$ |$$$$$$$  |
 *  \_______|  \____/ \__| \_______|\_______/
 *
 *  https://github.com/wangkevin1/Atlas
 *  Kevin Wang
 *
 */

var Atlas = angular.module('Atlas', ['ngAnimate', 'ui.router', 'ui.utils', 'ui.bootstrap', 'headroom']);

/////////////
//DEVELOPER//
/////////////

//console.monitorEvents(document.body);

//////////////
//PRODUCTION//
//////////////

Atlas.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
    }
]);


/////////
//BLOGS//
/////////

Atlas.provider('atBlog', ['$stateProvider',
    function ($stateProvider) {
        var _blogs = {};

        var BlogMeta = function (aData, aPrefix, aPostArray) {
            return {
                data: aData,
                prefix: aPrefix,
                postArray: aPostArray
            };
        };

        $stateProvider.state('blog', {
            abstract: true,
            url: '/blog',
            views: {
                'root@': {
                    templateUrl: 'vendor/atlas/templates/atBlog.html',
                    controller: ['$state', '$scope', 'atBlog',
                        function ($state, $scope, atBlog) {
                            $scope.getPost = function (blog, post) {
                                atBlog.getPostJson(blog, post, function (data) {
                                    $scope.atPost = data;
                                });
                            };
                            $scope.getArray = function (blog) {
                                atBlog.getPostArray(blog, function (data) {
                                    $scope.blogNav = data;
                                });
                            };
                        }
                    ]
                }
            }
        });

        var createBlog = function (name, aData, aPrefix, aPostArray) {
            _blogs[name] = new BlogMeta(aData, aPrefix, aPostArray);
            $stateProvider.state('blog.' + name, {
                url: '/' + name + '/:postId',
                views: {
                    'post@blog': {
                        templateUrl: 'vendor/atlas/templates/atBlogPost.html',
                        controller: ['$state', '$scope',
                            function ($state, $scope) {
                                $scope.getPost(name, $state.params.postId);
                            }
                        ]
                    },
                    'nav@blog': {
                        templateUrl: 'vendor/atlas/templates/atBlogNav.html',
                        controller: ['$scope',
                            function ($scope) {
                                $scope.blog = name;
                                $scope.getArray(name);
                        }]
                    }
                }
            });
            return this;
        };

        var $get = ['$http',
            function ($http) {
                var blogs = _blogs;

                var getPostJson = function (blogName, postId, callback) {
                    if (postId == '') {
                        getPostArray(blogName, function (data) {
                            postId = data[0].id;
                            var blog = blogs[blogName];
                            $http.get(blog.data + '/' + blog.prefix + postId + '.json')
                                .success(function (data, status, headers, config) {
                                    if (callback) {
                                        callback(data);
                                    }
                                }).error(function (data, status, headers, config) {
                                    console.error('atlas failed to retrieve: ' + blog.prefix + postId + '.json', '\nstatus: ' + status);
                                });
                        });
                    } else {
                        var blog = blogs[blogName];
                        $http.get(blog.data + '/' + blog.prefix + postId + '.json')
                            .success(function (data, status, headers, config) {
                                if (callback) {
                                    callback(data);
                                }
                            }).error(function (data, status, headers, config) {
                                console.error('atlas failed to retrieve: ' + blog.prefix + postId + '.json', '\nstatus: ' + status);
                            });
                    }
                };

                var getPostArray = function (blogName, callback) {
                    $http.get(blogs[blogName].postArray).success(function (data, status, headers, config) {
                        if (callback) {
                            callback(data);
                        }
                    });
                };

                return {
                    getPostJson: getPostJson,
                    getPostArray: getPostArray
                };
            }
        ];

        return {
            $get: $get,
            createBlog: createBlog
        };
    }
]);


////////////////
//POST CREATOR//
////////////////

Atlas.config(['$stateProvider',
    function ($stateProvider) {
        //static site engine data creator
        $stateProvider.state('atlas', {
            url: '/atlas',
            views: {
                'root@': {
                    templateUrl: 'vendor/atlas/templates/atlas.html'
                }
            }
        });
    }
]);

Atlas.constant('AT_POST_SECTION_TYPE', {
    text: 0x0010,
    image: 0x0020,
    video: 0x0030
});

Atlas.factory('FAtPostSection', ['AT_POST_SECTION_TYPE',
    function (AT_POST_SECTION_TYPE) {
        var PostSection = function (aType, aContent, aCaption) {
            aContent = aContent || '';
            switch (aType) {
            case AT_POST_SECTION_TYPE.text:
                return {
                    type: 'text',
                    content: aContent
                };
                break;
            case AT_POST_SECTION_TYPE.image:
                aCaption = aCaption || '';
                return {
                    type: 'image',
                    content: aContent,
                    caption: aCaption
                };
                break;
            case AT_POST_SECTION_TYPE.video:
                return {
                    type: 'video',
                    content: aContent,
                };
                break;
            }
        };
        return PostSection;
}]);

Atlas.controller('CPostCreator', ['$scope', 'FAtPostSection', 'AT_POST_SECTION_TYPE',
    function ($scope, PostSection, AT_POST_SECTION_TYPE) {
        this.thePost = {
            prefix: "",
            id: "",
            title: "",
            subtitle: "",
            date: "",
            author: "",
            sections: []
        };

        this.SECTION_TYPE = AT_POST_SECTION_TYPE;

        this.addSection = function (sect) {
            this.thePost.sections.push(new PostSection(sect));
        };

        this.deleteSection = function (sectId) {
            this.thePost.sections.splice(sectId, 1);
        };

        this.dateSetToday = function () {
            $scope.atPost.date.$setViewValue('');
            this.thePost.date = moment().format('YYYYMMDD');
        };

        this.addSection(AT_POST_SECTION_TYPE.text);

        this.exportJson = function () {
            var e = document.createElement('a');
            e.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.thePost)));
            e.setAttribute('download', this.thePost.prefix + 'Post' + this.thePost.id + '.json');
            e.click();
        };
}]);


/////////
//PAGES//
/////////

Atlas.provider('atPage', ['$stateProvider',
    function ($stateProvider) {
        var _pages = {};

        var PageMeta = function (aData) {
            return {
                data: aData
            };
        };

        var createPage = function (name, aData) {
            _pages[name] = new PageMeta(aData);
            $stateProvider.state(name, {
                url: '/' + name + '/:sectionId',
                views: {
                    'root@': {
                        templateUrl: aData,
                        controller: ['$state', '$scope', '$uiViewScroll', '$timeout',
                            function ($state, $scope, $uiViewScroll, $timeout) {
                                $scope.$on('$viewContentLoaded', function (e) {
                                    $timeout(function () {
                                        if ($state.params.sectionId == '') {
                                            $('body').animate({
                                                scrollTop: '0'
                                            }, 64);
                                        } else {
                                            $uiViewScroll($('#' + $state.params.sectionId));
                                        }
                                    }, 0);
                                });
                        }
                        ]
                    }
                }
            });
            return this;
        };

        var $get = [

            function () {
                var pages = _pages;

                return {

                };
            }
        ];

        return {
            $get: $get,
            createPage: createPage
        };
}]);

//////////////////
//NAVIGATION BAR//
//////////////////

Atlas.provider('atNav', [

    function () {
        var _brand = "";
        var _states = [];

        var setBrand = function (aTemplate, aState) {
            _brand = {
                template: aTemplate,
                state: aState
            };
            return this;
        };

        var addTab = function (aName, aState) {
            _states.push({
                name: aName,
                state: aState
            });
            return this;
        };

        var $get = ['$http',

            function ($http) {
                var brand = _brand;
                var states = _states;

                var getBrand = function (callback) {
                    return brand;
                };

                var getTabs = function () {
                    return states;
                };

                return {
                    getBrand: getBrand,
                    getTabs: getTabs
                };
            }
        ];
        return {
            $get: $get,
            setBrand: setBrand,
            addTab: addTab
        };
    }
]);

Atlas.directive('atNavBar', [

    function () {
        return {
            restrict: 'A',
            scope: {},
            templateUrl: 'vendor/atlas/templates/atNavBar.html',
            controller: ['$scope', 'atNav',
                function ($scope, atNav) {
                    $scope.brand = atNav.getBrand();
                    $scope.tabs = atNav.getTabs();
                }
            ]
        };
    }
]);


Atlas.directive('atNavSpacer', function () {
    return {
        restrict: 'A',
        scope: {},
        controller: ['$scope', '$element',
            function ($scope, $element) {
                $element.height($element.parent().find('.atnavbar').height());
            }
        ]
    };
});


//////////////
//ATLAS UTIL//
//////////////

Atlas.factory('prependChar', [

    function () {
        var prepend = function (num, char, length) {
            num = '' + num;
            if (num.length >= length) {
                return num;
            } else {
                return prepend(char + num, char, length);
            }
        };

        return prepend;
}]);

Atlas.filter('atDate', [

    function () {
        var atDate = function (date, format) {
            date = date || '';
            date = date.trim();
            format = format || false;
            if (date.length == 8) {
                var m = moment(date, 'YYYYMMDD');
                if (format == 'long') {
                    return m.format('MMMM Do, YYYY');
                } else if (format == 'us') {
                    return m.format('MM-DD-YYYY');
                } else {
                    return m.format('YYYY-MM-DD');
                }
            } else {
                return '0000-00-00';
            }
        };

        return atDate;
    }
]);

Atlas.directive('atCountdown', [

    function () {
        return {
            restrict: 'A',
            scope: {
                end: '@atCountdown',
                postMessage: '@atCountdownPost'
            },
            template: '<h1 class="atCountdown">{{time}}<br><small>{{postMessage}}</small></h1>',
            controller: ['$scope', '$interval',
                function ($scope, $interval) {
                    var timerDaemon = $interval(function () {
                        $scope.time = moment.duration(moment($scope.end).valueOf() - moment().valueOf()).format('D  |  hh : mm : ss');
                    }, 1000);
        }]
        };
}]);

Atlas.directive('atCarousel', [

    function () {
        return {
            restrict: 'A',
            scope: {
                imageArray: '@atCarousel',
                interval: '@atInterval',
                height: '@atHeight',
                width: '@atWidth'
            },
            transclude: true,
            templateUrl: 'vendor/atlas/templates/atCarousel.html',
            controller: ['$scope', '$element', '$http', '$interval', '$animate',
                function ($scope, $element, $http, $interval, $animate) {
                    $element.addClass('at-carousel');
                    $scope.height = $scope.height || '100vh';
                    $scope.width = $scope.width || '100%';
                    $element.css('height', $scope.height).css('width', $scope.width);
                    $scope.interval = ($scope.interval || 0) + 2000;
                    $http.get($scope.imageArray)
                        .success(function (data, status, headers, config) {
                            var i = 1;
                            $element.find('.at-slide-current').css('background-image', 'url(' + data[0] + ')');
                            $element.find('.at-slide-latter').css('background-image', 'url(' + data[1] + ')');
                            var carouselDaemon = $interval(function () {
                                var slide1 = $element.find('.at-slide-current');
                                var slide2 = $element.find('.at-slide-latter');
                                $animate.addClass(slide1, 'at-slide-slide');
                                $animate.addClass(slide2, 'at-slide-slide').then(function () {
                                    i = (i + 1) % data.length;
                                    slide1.css('background-image', 'url(' + data[i] + ')');
                                    $animate.setClass(slide1, 'at-slide-latter', 'at-slide-current at-slide-slide');
                                    $animate.setClass(slide2, 'at-slide-current', 'at-slide-latter at-slide-slide');
                                });
                            }, $scope.interval);
                        })
                        .error(function (data, status, headers, config) {
                            console.error('atlas failed to retrieve: ' + $scope.imageArray, '\nstatus: ' + status);
                        });
                }
            ]
        };
    }
]);


///////////////
//MAIN ROUTER//
///////////////

Atlas.provider('at', ['$urlRouterProvider', 'atBlogProvider', 'atPageProvider', 'atNavProvider',
    function ($urlRouterProvider, blog, page, nav) {

        var defaultRoute = function (route) {
            $urlRouterProvider.otherwise(route);
        };

        var createBlog = function (name, data, prefix, postArray) {
            blog.createBlog(name, data, prefix, postArray);
            return this;
        };

        var createPage = function (name, data) {
            page.createPage(name, data);
            return this;
        };

        var setBrand = function (template, state) {
            nav.setBrand(template, state);
            return this;
        };

        var addTab = function (name, state) {
            nav.addTab(name, state);
            return this;
        };

        var $get = function () {
            return {

            };
        };

        return {
            $get: $get,
            defaultRoute: defaultRoute,
            createBlog: createBlog,
            createPage: createPage,
            setBrand: setBrand,
            addTab: addTab
        };
    }
]);


//ATLAS//

console.log('%c\n' +
    '            $$\\     $$\\                      \n' +
    '            $$ |    $$ |                     \n' +
    '  $$$$$$\\ $$$$$$\\   $$ | $$$$$$\\   $$$$$$$\\  \n' +
    '  \\____$$\\\\_$$  _|  $$ | \\____$$\\ $$  _____| \n' +
    '  $$$$$$$ | $$ |    $$ | $$$$$$$ |\\$$$$$$\   \n' +
    ' $$  __$$ | $$ |$$\\ $$ |$$  __$$ | \\____$$\\  \n' +
    ' \\$$$$$$$ | \\$$$$  |$$ |\\$$$$$$$ |$$$$$$$  | \n' +
    '  \\_______|  \\____/ \\__| \\_______|\\_______/  \n' +
    '\n' +
    'https://github.com/wangkevin1/Atlas                                  \n' +
    'Kevin Wang\n\n ',
    'font-family: Consolas, Monaco, monospace; color: #bc2200');