ProJack.issues = angular.module("IssuesModule", 
		['CustomersModule', 'MileStonesModule','SecurityModule', 'Utils', 'angularFileUpload', 'ui.tinymce', 'ui.bootstrap']);

ProJack.issues.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/issues', {
            controller : 'IssueIndexController',
            templateUrl : './modules/issues/views/index.html'
        })
        .when('/issues/customer/:cid/create', {
            controller : 'IssueCreateController',
            templateUrl : './modules/issues/views/create.html'
        })
        .when('/issues/customer/:cid/milestone/:mid/create', {
            controller : 'IssueCreateController',
            templateUrl : './modules/issues/views/create.html'
        })
        .when('/issues/:id/edit', {
            controller : 'IssueEditController',
            templateUrl : './modules/issues/views/edit.html'
        })
        .when('/issues/:id/modify', {
            controller : 'IssueModifyController',
            templateUrl : './modules/issues/views/modify.html'
        })
        .when('/issues/changelog', {
            controller : 'IssueChangelogController',
            templateUrl : './modules/issues/views/changelog.html'
        });
}]);