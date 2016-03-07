ProJack.issues = angular.module("IssuesModule", 
		['ProjectsModule', 'SecurityModule', 'Utils', 'ngFileUpload', 'ui.tinymce', 'ui.bootstrap', 'IssueTagsModule']);

ProJack.issues.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/issues', {
            controller : 'IssueIndexController',
            templateUrl : './modules/issues/views/index.html'
        })
        .when('/issues/create', {
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

/**
 * Directive for providing the issue state as label
 */
ProJack.issues.directive('buglabel', function() {
	return {
		restrict:		'A',
		scope	: {
			'type'		: '@type'
		},
		templateUrl		: './modules/issues/views/directives/typelabel.html'
	};
});

/**
 * Directive to display the solution for an issue
 */
ProJack.issues.directive('solutionlabel', function() {
	return {
		restrict:		'A',
		scope	: {
			'solution'	: '@solution'
		},
		templateUrl 	: './modules/issues/views/directives/solutionlabel.html'
	};
});

ProJack.issues.directive('statelabel', function() {
	return {
		restrict:		'A',
		scope : {
			'state'		: '@state'
		},
		templateUrl		: './modules/issues/views/directives/statelabel.html'
	};
});

ProJack.issues.directive('searchCriteria', ['ProjectService', function(projectService) {

	var locKey = '__IssuesIndex_Criteria';
	
	var linkFn = function(scope) {
		
		scope.criteria = {
			predicates : {
				type : '',
				selection : 0,
				status : 0,
				project : '',
				tags : []
			},
			sort : {
				predicate : 'number',
				reverse   : 'false'
			},
			page : {
				offset    : 0,
				size      : 50
			}
		};
		
		scope.projects = [];

		projectService.getAllProjects().then(function(data) {
			scope.projects.push({ _id : '', name : 'All'});
			for (var i in data)
				scope.projects.push(data[i]);
		});
		
		if (localStorage.getItem(locKey)) {
			scope.criteria.predicates = JSON.parse(localStorage.getItem(locKey));
			scope.criteria.page.offset = 0;
		}
		
		scope.$watch('criteria.predicates', function(nval) {
			localStorage.setItem(locKey, JSON.stringify(nval));
			scope.criteria.page.offset = 0;
			scope.$emit('Issues::SearchCriteriaDirective::predicates-changed', scope.criteria);
		}, true);
		
		scope.$on('Issues::IssueController::scroll-event', function() {
			scope.criteria.page.offset += scope.criteria.page.size;
			scope.$emit('Issues::SearchCriteriaDirective::page-changed', scope.criteria);
		});
		
		scope.$on('Issues::IssueController::sort-changed', function($event, sort) {
			scope.criteria.sort = sort;
			scope.$emit('Issues::SearchCriteriaDirective::predicates-changed', scope.criteria);
		});
	};
	
	return {
		restrict:		'A',
		templateUrl:	'./modules/issues/views/directives/search-criteria.html',
		link: linkFn, 
		scope :false 
	}
}]);


ProJack.issues.directive('trackingControls', ['$compile', '$uibModal', 'IssueService', 'SecurityService', function($compile, $modal, service, secService) {

	var linkFn = function(scope, elem, attrs) {
	
		scope.user = secService.getCurrentUserName();
		
		scope.isTimeStartable = function() {
			return service.isTimeStartable(scope.issue);
		};
		
		scope.isTimeResumeable = function() {
			return service.isTimeResumable(scope.issue);
		};
		
		scope.isTimePauseable = function() {
			return service.isTimePauseable(scope.issue);
		};
		
		scope.isTimeStoppable = function() {
			return service.isTimePauseable(scope.issue);
		};
	
		scope.startTimeTracking = function() {
			service.startTimeTracking(scope.issue);
			scope.$emit('trackingStarted', scope.issue);
		};
		
		scope.pauseTimeTracking = function() {
			service.pauseTimeTracking(scope.issue);
		};
		
		scope.stopTimeTracking = function() {
			if (scope.modalOnStop == 'true') {
				$modal.open({
					controller		: 'IssueTimeTrackModalController',
					templateUrl 	: './modules/issues/views/timetrack-modal.html',
					size			: 'lg',
					resolve : {
						data : function() {
							return { user : scope.user, issue : scope.issue };
						}
					}
				});
			} else {
				scope.$emit('trackingStopped', service.getCurrentTimeTrackingData(scope.issue));
			}
		};
		
		instrumentControls(scope, elem);
	};
	
	var instrumentControls = function(scope, elem) {
		var children = elem.children('[data-control-type]');
		for (var i=0; i < children.length; i++) {
			
			var item = $(children[i]);
			var v = item.attr('data-control-type');
			
			if (v == 'play') {
				item.attr('data-ng-if', 'isTimeStartable()');
				item.attr('data-ng-click', 'startTimeTracking()');
			}
			
			if (v == 'resume') {
				item.attr('data-ng-if', 'isTimeResumeable()');
				item.attr('data-ng-click', 'startTimeTracking()');
			}
			
			if (v == 'pause') {
				item.attr('data-ng-if', 'isTimePauseable()');
				item.attr('data-ng-click', 'pauseTimeTracking()');
			}
			
			if (v == 'stop') {
				item.attr('data-ng-if', 'isTimeStoppable()');
				item.attr('data-ng-click', 'stopTimeTracking()');
			}
		};
		$compile(elem.html())(scope, function(cloned) {
			for (var i=0; i < children.length; i++)
				$(children[i]).remove();
			elem.append(cloned);
		});
	};
	
	return {
		restrict:		'A',
		scope	: {
			'issue'			: '=ngModel',
			'modalOnStop' 	: '@'
		},
		link : linkFn
	};
}]);