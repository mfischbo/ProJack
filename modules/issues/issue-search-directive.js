ProJack.issues.directive('issueSearchDirective', ['KT', 'IssueService', 'CustomerService', '$sce', function(KT, service, customerService, $sce) {

	var locKey = '__Projack.issues.searchDirective.criteria';
	
	var linkFn = function(scope, elem, attrs) {
	
		scope.issues = [];
		scope.issue  = undefined;
		scope.html = {
				description : '',
				notes: ''
		};
		
		var scrollTimeout = undefined;

		// we sort by issue number by default here
		scope.$broadcast('Issues::IssueController::sort-changed', { predicate : 'number', reverse : 'false' });
		
		scope.$on('Issues::SearchCriteriaDirective::predicates-changed', function($event, criteria) {
			service.getIssuesByCriteria(criteria.predicates, criteria.sort, criteria.page).then(function(data) {
				scope.issues = data;
			});
		});
		
		scope.$on('Issues::SearchCriteriaDirective::page-changed', function($event, criteria) {
			service.getIssuesByCriteria(criteria.predicates, criteria.sort, criteria.page).then(function(data) {
				scope.issues = scope.issues.concat(data);
			});
		});

		scope.scroll = function() {
			if (!scrollTimeout) {
				scrollTimeout = window.setTimeout(function() {
					scope.$broadcast('Issues::IssueController::scroll-event');
					scrollTimeout = undefined;
				}, 500);
			}
		};
		
		scope.selectIssue = function(issue) {
			KT.remove('_id', issue._id, scope.issues);
			scope.$emit('Issues::SearchDirective::issue-selected', issue);
		};
		
		scope.showDetails = function(issue) {
			if (!scope.issue || scope.issue._id != issue._id) {
				scope.issue = issue;
				scope.html.description = $sce.trustAsHtml(scope.issue.description);
			} else {
				scope.issue = undefined;
			}
		};
	};
	
	return {
		restrict : 'A',
		scope    : { },
		templateUrl : './modules/issues/views/directives/issue-search-directive.html',
		link : linkFn
	};
}]);	
