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

		// sort the lanes issues by their state
		scope.issues = {
				unassigned : [],
				assigned   : [],
				resolved   : [],
				done	   : []
		};
		

		scope.$on('issuesReloaded', function() {
			scope.sortIssues();
		});
		
	
		scope.sortIssues = function() {
			for (var i in scope.lane.issues) {
				var issue = scope.lane.issues[i];
				if (issue.state == 'NEW')
					scope.issues.unassigned.push(issue);
				if (issue.state == 'RESOLVED')
					scope.issues.resolved.push(issue);
				if (issue.state == 'CLOSED')
					scope.issues.done.push(issue);
			}
		};
		
		/**
		 * Toggles expansion state of the lane
		 */
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