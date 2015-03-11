ProJack.sprint = angular.module('SprintModule', ['Utils', 'ui.tinymce']);
ProJack.sprint.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
		.when('/sprints', {
			controller	:	'SprintIndexController',
			templateUrl :	'./modules/sprints/views/index.html'
		})
		.when('/sprints/create', {
			controller	:	'SprintCreateController',
			templateUrl	:	'./modules/sprints/views/create.html'
		})
		.otherwise({redirectTo : '/sprints'})
}]);