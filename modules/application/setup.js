var T = angular.module('Setup', ['ngRoute', 
                                 'SecurityModule']);
T.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
	
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
	
	$httpProvider.defaults.useXDomain = true;
	$httpProvider.defaults.withCredentials = true;
}]);


T.controller('SetupController', ['$scope', '$http', '$q', 'SecurityService', function($scope, $http, $q, secService) {
	
	$scope.docs = getDesignDocs();
	
	$scope.db = {
			name 	 : '',
			username : '',
			password : '',
			createDB : false
	};
	
	$scope.status = {
			isDBCreated : undefined,
			isDDocsCreated : undefined,
			isAdminCreated : undefined
	};

	$scope.setup = function() {
		
		secService.login($scope.db.username, $scope.db.password).then(function(data) {
			if (data.ok) {
				
				// database creation and design doc installation
				if ($scope.db.createDB) {
					$scope.createDatabase().then(function(result) {
						if (result.status == 'OK') {
							$scope.status.isDBCreated = true;
							$scope.installDesignDocs();
							$scope.createAdminAccount();
						} else {
							$scope.status.isDBCreated = false;
						}
					});
				} else {
					$scope.installDesignDocs();
					$scope.createAdminAccount();
				}	
			}
		});
	};
	
	$scope.createDatabase = function() {
		
		var def = $q.defer();
		$http.put(ProJack.config.srvUrl + '/' + $scope.db.name).then(function() {
			def.resolve({status : 'OK' });
		}, function() {
			def.reject({status : 'error'});
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
	
	$scope.createAdminAccount = function() {
		var user = {
			name : $scope.db.username,
			password : $scope.db.password
		};
		secService.addUser(user, 'admins').then(function() {
			$scope.status.isAdminCreated = true;
		}, function() {
			$scope.status.isAdminCreated = false;
		});
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