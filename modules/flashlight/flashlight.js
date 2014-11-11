ProJack.flashlight = angular.module('FlashLightModule', ['Utils']);

ProJack.flashlight.service('FlashLightService', ['$http', function($http) {
	
	return {
		
		prepareESQuery : function(query) {
		
			// query for issues
			if (query.indexOf("#") == 0)
				return query.substring(1);
			
			var t = query.split(" ");
			var retval = "";
			for (var i in t) {
				retval += "+" + t[i] + "* ";
			}
			return retval;
		},
		
		parseResults : function(response) {
			var retval = {
						customers : [],
						issues    : [],
						milestones: []
				};
				
				for (var i in response.data.hits.hits) {
					var e = response.data.hits.hits[i];
					
					if (e._type == 'customer')
						retval.customers.push(e._source);
					if (e._type == 'issue')
						retval.issues.push(e._source);
					if (e._type == 'milestone')
						retval.milestones.push(e._source);
				}
				
				// sum up all results
				var len = 0;
				for (var q in retval) {
					len += retval[q].length;
				}
				retval.length = len;
				return retval;
		},
		
		search : function(query) {
			
			var q = this.prepareESQuery(query);
			if (query.indexOf("#") == 0) {
				return $http.get(ProJack.config.esUrl + "/issue/_search?q=number:>=" + q).then(this.parseResults);
			} else {
				return $http.get(ProJack.config.esUrl + "/_search?q=" + this.prepareESQuery(query)).then(this.parseResults);
			}
		}
	}
}]);

ProJack.flashlight.controller('FlashLightController', ['$scope', '$location', 'FlashLightService', function($scope, $location, service) {

	$scope.panelVisible = false;
	$scope.query = '';
	
	$scope.results = {};

	var tOut = undefined;
	
	$scope.checkVisible = function() {
		if ($scope.query.length > 0)
			$scope.panelVisible = true;
		else
			$scope.panelVisible = false;
	}
	
	$scope.clearSearch = function(href) {
		$scope.query = '';
		$scope.panelVisible = false;
	};
	
	$scope.$watch('query', function(val) {
		
		if (tOut) window.clearTimeout(tOut);
		tOut = window.setTimeout(function() {
			if (val.length > 1) {
				service.search(val).then(function(data) {
					$scope.results = data;
				});
			}
		}, ProJack.config.searchDelayTimeout);
	})
}]);