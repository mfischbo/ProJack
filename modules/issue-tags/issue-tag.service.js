ProJack.issueTags = angular.module('IssueTagsModule', []);

ProJack.issueTags.service('IssueTagsService', ['$http', function($http) {

	return {
		getAllTags : function() {
			return $http.get(ProJack.config.dbUrl + '/issue-tags').then(function(response) {
				return response.data.tags;
			}, function(failure) {
				
				// document is not yet available. Create a new one.
				$http.put(ProJack.config.dbUrl + '/issue-tags', { tags : [] });
				return [];
			});
		},
	
		pushTag : function(tag) {
			$http.get(ProJack.config.dbUrl + '/issue-tags').then(function(response) {
				var document = response.data;
				if (document.tags.indexOf(tag) == -1) {
					document.tags.push(tag);
					$http.put(ProJack.config.dbUrl + '/issue-tags', document);
				}
			});
		}
	}
}]);

ProJack.issueTags.directive('issueTags', ['IssueTagsService', function(service) {

	var linkFn = function(scope, elem, attrs) {
	
		// contains all tags from the document 'issue-tags'
		scope.availableTags = [];
	
		// contains all suggestions based on the users input
		scope.suggestions = [];
	
		// if tags array is not available for the given issue we create one
		if (!scope.tags || scope.tags.length == 0)
			scope.tags = [];
	
		scope.onInputChange = function() {
			if (scope.availableTags.length == 0) {
				service.getAllTags().then(function(tags) {
					scope.availableTags = tags;
					scope.availableTags.forEach(function(t) {
						if (t.toLowerCase().indexOf(scope.value.toLowerCase()) == 0)
							scope.suggestions.push(t);
					});
				});
			} else {
				scope.suggestions = [];
				scope.availableTags.forEach(function(t) {
					if (t.toLowerCase().indexOf(scope.value.toLowerCase()) == 0) {
						scope.suggestions.push(t);
					}
				});
			}
		};
	
		/**
		 * Adds a new tag to the tags document on remote and applies it to the issues tags
		 */
		scope.addTag = function() {
			var tag = scope.value;
			scope.availableTags.push(tag);
			scope.tags.push(tag);
			scope.value = '';
			service.pushTag(tag);
		};
		
		scope.selectSuggestion = function(item) {
			scope.tags.push(item);
			scope.value = '';
		};
		
		scope.purge = function(tag) {
			for (var i in scope.tags) {
				if (scope.tags[i] == tag)
					scope.tags.splice(i, 1);
			}
		}
	};
	
	return {
		restrict : 'A',
		templateUrl : './modules/issue-tags/views/issue-tags.directive.html',
		link : linkFn,
		scope : {
			tags : '=',
			allowCreate : '@'
		}
	}
}]);