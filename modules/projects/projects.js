ProJack.projects = angular.module('ProjectsModule', []);
ProJack.projects.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
		.when('/projects', {
			controller : 'ProjectIndexController',
			templateUrl : './modules/projects/views/index.html'
		})
		.when('/projects/create', {
			controller : 'ProjectCreateController',
			templateUrl : './modules/projects/views/create.html'
		})
		.when('/projects/:id/edit', {
			controller : 'ProjectEditController',
			templateUrl : './modules/projects/views/edit.html'
		})
		.otherwise({ redirectTo : '/projects '});
}]);