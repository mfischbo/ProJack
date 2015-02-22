ProJack.milestones = angular.module('MileStonesModule', ['Utils', 'CustomersModule', 'IssuesModule', 'TemplateModule', 'ui.tinymce', 'nvd3']);
ProJack.milestones.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/milestones', {
            controller : 'MileStonesController',
            templateUrl : './modules/milestones/views/index.html'
        })
        .when('/milestones/create', {
            controller : 'MileStonesCreateController',
            templateUrl : './modules/milestones/views/create.html'
        })
        .when('/milestones/:id/edit', {
            controller : 'MileStonesEditController',
            templateUrl : './modules/milestones/views/edit.html'
        })
        .when('/milestones/:id/analyze', {
            controller : 'MileStonesAnalyzeController',
            templateUrl : './modules/milestones/views/analyze.html'
        });
}]);