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


ProJack.sprint.directive('swimlane', ['KT', 'IssueService', 'SecurityService', '$uibModal', function(KT, iService, secService, $modal) {

	var linkFn = function(scope, elem, attrs) {
		
		scope.metaInfVisible = false;
		scope.lane.state = 'EXPANDED';
		scope.shadow = angular.copy(scope.lane);
	
		/**
		 * Saves the lanes contents
		 */
		scope.updateLane = function() {
			scope.lane.title = scope.shadow.title;
			scope.metaInfVisible = false;
			scope.$emit('Sprints::Swimlane::lane-changed');
		};
	
		/**
		 * Removes the lane and emits an event containing all the issues of the lane
		 */
		scope.removeLane = function() {
			KT.confirm("Do you really want to remove this lane? All issues will be sorted in the default lane then.", function() {
				if (scope.lane.isDefaultLane) {
					console.error("You shouldn't even see this button!");
					return;
				} else {
					var issues = scope.lane.issues;
					var defaultLane = KT.find('isDefaultLane', true, scope.sprint.lanes);
					defaultLane.issues = defaultLane.issues.concat(issues);
					KT.remove('id', scope.lane.id, scope.sprint.lanes);
					scope.$emit('Sprints::Swimlane::lane-changed');
				}
			});
		};
		
		scope.cancelEdit = function() {
			scope.shadow.title = scope.lane.title;
			scope.metaInfVisible = false;
		};
		
	
		/**
		 * Removes the issue from the current sprint and put's it back on the backlog
		 */
		scope.removeFromSprint = function(issue) {
			KT.remove('_id', issue._id, scope.lane.issues);
			scope.$emit('Sprints::Swimlane::lane-changed');
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
		
		
		scope.pushToLane = function(issue, lane) {
			KT.remove('_id', issue._id, scope.lane.issues);
			lane.issues.push(issue);
			scope.$emit('Sprints::Swimlane::lane-changed');
		};
		
		// issue drag-drop
		scope.onUnassignedDrop = function(event, $data) {
			var issue = KT.find('_id', $data._id, scope.lane.issues);
			if (!issue) {
				scope.lane.issues.push($data);
			}
			issue.state  = 'NEW';
			issue.assignedTo = '';
			iService.updateIssue(issue);
		};
		
		scope.onAssignedDrop = function(event, $data) {
			var issue = KT.find('_id', $data._id, scope.lane.issues); 
			issue.state = 'ASSIGNED';
			issue.assignedTo = 'org.couchdb.user:' + secService.getCurrentUserName();
			iService.updateIssue(issue);
		};
		
		scope.onQADrop = function(event, $data) {
			var issue = KT.find('_id', $data._id, scope.lane.issues);
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
		};
		
		scope.onDoneDrop = function(event, $data) {
			var issue = KT.find('_id', $data._id, scope.lane.issues);
			issue.state = 'CLOSED';
			iService.updateIssue(issue);
		};
		
		scope.validateUnassignedDrop = function(issue) {
			if (issue.state == 'NEW')
				return false;
			if (iService.hasActiveTracking(issue))
				return false;
			return true;
		};
		
		scope.validateAssignedDrop = function(issue) {
			if (issue.state == 'ASSIGNED')
				return false;
			if (iService.hasActiveTracking(issue))
				return false;
			return true;
		};
		
		scope.validateQADrop = function(issue) {
			if (issue.state == 'RESOLVED')
				return false;
			if (iService.hasActiveTracking(issue))
				return false;
			return true;
		};
		
		scope.validateDoneDrop = function(issue) {
			if (issue.state == 'CLOSED')
				return false;
			if (iService.hasActiveTracking(issue))
				return false;
			return true;
		};
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