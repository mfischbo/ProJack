/**
 * The sprint module provides a SCRUM style approach for a development cycle
 */
ProJack.sprint = angular.module('SprintModule', ['Utils', 'ui.tinymce']);
ProJack.sprint.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
		.when('/sprints', {
			controller	:	'SprintIndexController',
			templateUrl :	'./modules/sprints/views/sprint-index.html'
		})
		.when('/sprints/create', {
			controller	:	'SprintCreateController',
			templateUrl	:	'./modules/sprints/views/create.html'
		})
		.when('/sprints/:id/edit', {
			controller  : 	'SprintEditController',
			templateUrl :   './modules/sprints/views/create.html'
		})
		.otherwise({redirectTo : '/sprints'})
}]);


ProJack.sprint.directive('swimlane', ['SprintService', 'IssueService', function(service, iService) {

	var linkFn = function(scope, elem, attrs) {
		
		scope.metaInfVisible = false;
		scope.lane.state = 'EXPANDED';

		// load all issues for the current sprint
		iService.getIssuesBySprint(scope.sprint).then(function(issues) {
			scope.issues = issues;
		});
		
		scope.toggleExpansion = function() {
			if (scope.lane.state == 'EXPANDED')
				scope.lane.state = 'COLLAPSED';
			else
				scope.lane.state = 'EXPANDED';
		};
		
		scope.showMetaInf = function(value) {
			scope.metaInfVisible = value;
		};
	};
	
	return {
		restrict : 	'A',
		scope : {
			'lane': 	'=',
			'sprint' : '='
		},
		templateUrl 	: './modules/sprints/views/directives/swimlane.html',
		link 	: linkFn
	};
}]);