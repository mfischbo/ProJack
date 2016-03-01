var T = angular.module('Setup', ['ngRoute', 'CustomersModule', 'GitlabModule', 'IssuesModule', 'SecurityModule', 'SprintModule']);
T.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
		.when('/', {
			controller : 'SetupController',
			templateUrl : 'modules/application/views/setup.html'
		})
		.when('/update', {
			controller : 'UpdateController',
			templateUrl : 'modules/application/views/update.html'
		})
		.otherwise({ redirectTo : '/' });
}]);


T.controller('SetupController', ['$scope', '$http', '$q', function($scope, $http, $q) {
	
	$scope.docs = getDesignDocs();
	
	$scope.db = {
			name 	 : '',
			username : '',
			password : '',
			createDB : false
	};
	
	$scope.status = {
			isDBCreated : undefined,
			isDDocsCreated : undefined 
	};

	$scope.setup = function() {
		
		// set credentials for those operations
		if ($scope.db.username.length > 0 && $scope.db.password.length > 0) {
			$http.defaults.headers.common['Authorization'] = 'Basic ' + btoa($scope.db.username + ':' + $scope.db.password);
		}
		
		if ($scope.db.createDB) {
			$scope.createDatabase().then(function(result) {
				if (result.status == 'OK') {
					$scope.status.isDBCreated = true;
					$scope.installDesignDocs();
				} else {
					$scope.status.isDBCreated = false;
				}
			});
		} else {
			$scope.installDesignDocs();
		}
	};
	
	$scope.createDatabase = function() {
		
		var def = $q.defer();
		$http({
			url 	: ProJack.config.srvUrl + '/' + $scope.db.name,
			method 	: 'PUT'
		}).success(function() {
			def.resolve({status : 'OK'});
		}).error(function() {
			def.resolve({status : 'error'});
		});
		return def.promise;
	};
	
	$scope.installDesignDocs = function() {
		$scope.status.isDDocsCreated = true;
		for (var i in $scope.docs) {
			$http.put(ProJack.config.srvUrl + '/' + $scope.db.name + '/_design/' + $scope.docs[i].name, $scope.docs[i].doc).error(function() {
				$scope.status.isDDocsCreated = false;
			});
		}
	};
}]);

T.controller('UpdateController', ['$scope', 'SprintService', 'IssueService', function($scope, service, issueService) {
	

	/**
	 * Updates the sprint model.
	 * Pulling all issues assigned to a sprint and add them to a 
	 * default lane within the sprint 
	 */
	$scope.updateSprintModel = function() {
	
		var smap = { };
		
		service.getSprintsStartingAt(new Date(0)).then(function(sprints) {
			
			for (var q in sprints) {
				smap[sprints[q]._id] = sprints[q];
				issueService.getIssuesBySprint(sprints[q]).then(function(issues) {
					var sprint = smap[issues[0].sprint];
					sprint = service.prepareSprint(sprint, issues);
					service.saveSprint(sprint);
				});
			}
		});
	};
}]);