ProJack.security = angular.module("SecurityModule", ['Utils']);
ProJack.security.service("SecurityService", ['$http', function($http) {
	
	return {
	
		newUser : function() {
			return { 
				name : "",
				password : "",
				roles : [],
				type : "user",
				profile : {
					firstName 	: '',
					lastName 	: '',
					email		: ''
				}
			}
		},
		
		getAllUserNames : function() {
			return $http.get(ProJack.config.srvUrl + "/_users/_all_docs").then(function(response) {
				var retval = [];
				for (var i in response.data.rows) {
					if (response.data.rows[i].id.indexOf("org.couchdb.user") == 0) {
						var tmp = response.data.rows[i].id.split(":");
						tmp.splice(0,1);
						var login = tmp.join(":");
						retval.push({id : response.data.rows[i].id, login : login});
					} 
				}
				return retval;
			});
		},
		
		getUserById : function(id) {
			return $http.get(ProJack.config.srvUrl + "/_users/" + id).then(function(response) {
				return response.data;
			});
		},
		
		createAdminUser : function(user) {
			return $http.put(ProJack.config.srvUrl + "/_config/admins/" + user.name, user.password)
				.then(function(response) {
					return response.data;
				});
		},
		
		createUser : function(user) {
			return $http.put(ProJack.config.srvUrl + "/_users/org.couchdb.user:" + user.name, user)
				.then(function(response) {
					return response.data;
				});
		},
		
		addUserAsMember : function(user) {
			$http.get(ProJack.config.dbUrl + "/_security").then(function(response) {
				var data = response.data;
				if (data.members.names.indexOf(user.name) > -1)
					return;
				else {
					data.members.names.push(user.name);
					$http.put(ProJack.config.dbUrl + "/_security", data); // shit always goes right!
				}
			});
		},
		
		updateUser : function(user) {
			return $http.put(ProJack.config.srvUrl + "/_users/" + user._id, user)
				.then(function(response) {
					return response.data;
				});
		},
		
		login : function(username, password) {
			return $http.post(ProJack.config.srvUrl + "/_session", {name : username, password : password })
				.then(function(response) {
					return response.data;
				});
		},
		
		getCurrentSession : function() {
			return $http.get(ProJack.config.srvUrl + "/_session").then(function(response) {
				return response.data;
			});
		},
		
		getCurrentUserName : function() {
			var u = JSON.parse(sessionStorage.getItem(ProJack.config.sessionKey));
			return u.name;
		},
		
		logout : function() {
			return $http({
				method : 'DELETE',
				url    : ProJack.config.srvUrl + "/_session"
			}).then(function(response) {
				return response.data;
			});
		}
	};
}]);

ProJack.security.directive("userSelector", ['SecurityService', 'KT', function(service, KT) {

	return {
        restrict:   "A",
        scope : {
            'selectAs': '=selectAs',
        },
        template: '<div class="input-group">'
            + '<select data-ng-model="selectAs" data-ng-options="u.id as u.login for u in users" class="form-control input-sm">'
            + '<option value="" disabled>User</option>'
            + '</select>'
            + '</div>',
        link:   function(scope, element, attrs) {

        	service.getAllUserNames().then(function(data) {
        		scope.users = data;
        	});
        } 
    };
}]);

ProJack.security.controller("UserIndexController", ['$scope', 'SecurityService', function($scope, service) {
	
	service.getAllUserNames().then(function(data) {
		$scope.users = data;
	});
}]);

ProJack.security.controller("UserEditController", ['$scope', '$routeParams', 'SecurityService', function($scope, $params, service) {
	
	service.getUserById($params.id).then(function(data) {
		$scope.user = data;
	});
	
	$scope.updateUser = function() {
		service.updateUser($scope.user);
	};
}]);

ProJack.security.controller("UserCreateController", ['$scope', 'SecurityService', function($scope, service) {
	
	$scope.user = service.newUser();
	
	$scope.createUser = function() {
		service.createUser($scope.user).then(function(data) {
			// add the user to the list of members for this db
			service.addUserAsMember($scope.user);
		});
	};
}]);

ProJack.security.controller("UserProfileController", ['$scope', 'SecurityService', function($scope, service) {
	
}]);