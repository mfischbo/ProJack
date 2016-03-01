/**
 * The sprint module provides a SCRUM style approach for a development cycle
 */
ProJack.sprint = angular.module('SprintModule', ['Utils', 'ui.tinymce']);
ProJack.sprint.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
		.when('/sprints', {
			controller	:	'SprintWorkbenchController',
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
		.otherwise({redirectTo : '/sprints'});
}]);


ProJack.sprint.directive('swimlane', ['KT', 'SprintService', 'IssueService', 'SecurityService', '$modal', function(KT, service, iService, secService, $modal) {

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
		scope.shadow = angular.copy(scope.lane);
	

		/**
		 * Should be triggered when the sprint model has changed.
		 */
		scope.$on('issuesReloaded', function() {
			scope.issues = {
					unassigned : [],
					assigned   : [],
					resolved   : [],
					done	   : []
			};
			scope.sortIssues();
		});
		

		/**
		 * Sorts issues into the correct columns in the lane, according to their state
		 */
		scope.sortIssues = function() {
		
			for (var i in scope.lane.issues) {
				var issue = scope.lane.issues[i];
				if (issue.state == 'NEW')
					scope.issues.unassigned.push(issue);
				if (issue.state == 'ASSIGNED')
					scope.issues.assigned.push(issue);
				if (issue.state == 'RESOLVED')
					scope.issues.resolved.push(issue);
				if (issue.state == 'CLOSED')
					scope.issues.done.push(issue);
			}
		};

		/**
		 * Saves the lanes contents
		 */
		scope.saveLane = function() {
			scope.lane.title = scope.shadow.title;
			// http call
			
			scope.metaInfVisible = false;
		};
	
		/**
		 * Removes the lane and emits an event containing all the issues of the lane
		 */
		scope.removeLane = function() {
			KT.confirm("Do you really want to remove this lane? All issues will be sorted in the default lane then.", function() {
				scope.$emit('remove-lane-requested', scope.lane);
			});
		};
		
		scope.cancelEdit = function() {
			scope.shadow.title = scope.lane.title;
			scope.metaInfVisible = false;
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
		
		
		scope.selectLane = function(issue, lane) {
			// remove the issue from all swimlanes an put it in the specified one
			KT.remove('_id', issue._id, scope.unassigned);
			lane.issues.push(issue);
		};
		
		// issue drag-drop
		scope.onUnassignedDrop = function(event, issue) {
			// assign issue to the current sprint
			if (!issue.sprint || issue.sprint.length == 0)
				issue.sprint = scope.sprint._id;
			issue.state  = 'NEW';
			issue.assignedTo = '';
			
			iService.updateIssue(issue).then(function() {
				scope.removeExcept(issue, scope.issues.unassigned);
				scope.issues.unassigned.push(issue);
			});
		};
		
		scope.onAssignedDrop = function(event, issue) {
			issue.state = 'ASSIGNED';
			issue.assignedTo = 'org.couchdb.user:' + secService.getCurrentUserName();
			
			iService.updateIssue(issue).then(function() {
				scope.removeExcept(issue, scope.issues.assigned);
				scope.issues.assigned.push(issue);
			});
		};
		
		scope.onQADrop = function(event, issue) {
			issue.state = 'RESOLVED';
			issue.assignedTo = '';
			var instance = $modal.open({
				controller : 'IssueResolveModalController',
				templateUrl: './modules/issues/views/resolve-modal.html',
				size:		 'lg',
				resolve : {
					data : function() {
						return { issue : issue };
					}
				}
			});
			instance.result.then(function() {
				scope.removeExcept(issue, scope.issues.done);
				scope.issues.resolved.push(issue);
			});
		};
		
		scope.onDoneDrop = function(event, issue) {
			issue.state = 'CLOSED';
			iService.updateIssue(issue).then(function() {
				scope.removeExcept(issue, scope.issues.done);
				scope.issues.done.push(issue);
			});
		};
		
		scope.validateUnassignedDrop = function(data) {
			if (KT.indexOf('_id', data._id, scope.issues.unassigned) >= 0)
				return false;
			if (iService.hasActiveTracking(data))
				return false;
			return true;
		};
		
		scope.validateAssignedDrop = function(data) {
			if (KT.indexOf('_id', data._id, scope.issues.assigned) >= 0)
				return false;
			if (iService.hasActiveTracking(data))
				return false;
			return true;
		};
		
		scope.validateQADrop = function(data) {
			if (KT.indexOf('_id', data._id, scope.issues.resolved) >= 0)
				return false;
			if (iService.hasActiveTracking(data))
				return false;
			return true;
		};
		
		scope.validateDoneDrop = function(data) {
			if (KT.indexOf('_id', data._id, scope.issues.done) >= 0)
				return false;
			if (iService.hasActiveTracking(data))
				return false;
			return true;
		};
		
		scope.removeExcept = function(issue, channel) {
			for (var q in scope.issues) {
				if (scope.issues[q] != channel) {
					KT.remove('_id', issue._id, scope.issues[q]);
				}
			}
		};
		
		// Initialization is done here
		scope.sortIssues();
	};
	
	return {
		restrict : 	'A',
		scope : {
			'lane'	 : '=',
			'sprint' : '=',
		},
		templateUrl 	: './modules/sprints/views/directives/swimlane.html',
		link 	: linkFn
	};
}]);