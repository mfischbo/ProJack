ProJack.security.service("SecurityService", ['$http', '$q', function($http, $q) {
	
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
			};
		},
		
		getAllUserNames : function() {
			return $http.get(ProJack.config.srvUrl + "/_users/_all_docs").then(function(response) {
				var retval = new Array();
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
				.success(function(response) {
					return response.data;
				}).error(function() {
					return undefined;
				});
		},
		
		addUserAsMember : function(user) {
			var def = $q.defer();
			$http.get(ProJack.config.dbUrl + "/_security").success(function(security) {
				if (security.members.names.indexOf(user.name) > -1)
					return;
				else {
					security.members.names.push(user.name);
					$http.put(ProJack.config.dbUrl + "/_security", security).success(function(data) {
						def.resolve(data);
					}).error(function() {
						def.reject();
					});
				}
			}).error(function() {
				def.reject();
			});
			return def.promise;
		},
	
		/**
		 * Updates the given user and returns the persisted instance 
		 */
		updateUser : function(user) {
			return $http.put(ProJack.config.srvUrl + "/_users/" + user._id, user)
				.then(function(response) {
					user._rev = response.data.rev;
					return user;
				});
		},
	
		isAdminUser : function() {
			var def = $q.defer();
			var current = this.getCurrentUserName();

			$http.get(ProJack.config.dbUrl + "/_security").success(function(security) {
				if (!security) 
					def.reject();
				if (security.admins.names.indexOf(current) > -1) {
					def.resolve(true);
				} else {
					def.resolve(false);
				}
			});
			return def.promise;
		},
		
		getCurrentSession : function() {
			return $http.get(ProJack.config.srvUrl + "/_session").then(function(response) {
				return response.data;
			});
		},
		
		getCurrentUser : function() {
			var uname = this.getCurrentUserName();
			return $http.get(ProJack.config.srvUrl + '/_users/org.couchdb.user:' + uname).then(function(response) {
				return response.data;
			});
		},
		
		getCurrentUserName : function() {
			var u = JSON.parse(localStorage.getItem(ProJack.config.sessionKey));
			return u.name;
		},
	
		/**
		 * Logs in a user for the given username and password
		 */
		login : function(username, password) {
			var q = $q.defer();
			var _self = this;
			$http.post(ProJack.config.srvUrl + "/_session", {name : username, password : password })
				.then(function(response) {
					if (response.data.ok) {
						_self.getCurrentSession().then(function(session) {
							localStorage.setItem(ProJack.config.sessionKey, JSON.stringify(session.userCtx));
							q.resolve(response.data);
						});
					} else {
						q.reject();
					}
				});
			return q.promise;
		},
	
		/**
		 * Deletes the current users session
		 */
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
