/**
 * Component that is capable of creating a new issue.
 * Displays a form to create the issue and persists the data using 
 * the issue service.
 * 
 * Emits the following events:
 * 'issue-created' (issue) 	: When a new issue has been created and persisted
 * 'close-requested'		: When the user requested to close the component
 * 
 */
ProJack.issues.directive('issueCreateDirective', ['IssueService', 'ProjectService', function(service, projectService) {

	var linkFn = function(scope, elem, attrs) {
		
		scope.issue = service.newIssue();
		scope.tinymceOptions = ProJack.config.tinyOptions;

		projectService.getAllProjects().then(function(projects) {
			scope.projects = projects;
		});
		
		/**
		 * Creates a new issue and emits it to parent scopes
		 */
		scope.createIssue = function() {
			service.createIssue(scope.issue).then(function(issue) {
				scope.$emit('Issues::CreateDirective::issue-created', issue);
			});
		};
		
		scope.cancelCreate = function() {
			delete scope.issue;
			scope.$emit('Issues::CreateDirective::close-requested');
		};
	};
	
	return {
		restrict : 'A',
		templateUrl : './modules/issues/views/directives/issue-create-directive.html',
		scope : {},
		link : linkFn
	};
}]);