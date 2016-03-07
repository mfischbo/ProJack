ProJack.projects.service('ProjectService', ['$http', 'KT', function($http, KT) {
	
	return {
	
		newProject : function() {
			return {
				type : 'project',
				dateCreated : new Date().getTime(),
				dateModified : new Date().getTime(),
				name : "",
				description : "",
				address : {
					street : "",
					zipcode : "",
					city : "",
					country : "DE"
				},
				gitlabProject : undefined,
				contacts : []
			};
		},
		
		/**
		 * Returns a prototype for a new contact object
		 */
		newContact : function() {
			return {
				id			: KT.UUID(),
				gender		: "M",
				firstName 	: "",
				lastName  	: "",
				phone	  	: "",
				email	  	: ""
			};
		},
		
		getAllProjects : function() {
			return $http.get(ProJack.config.dbUrl + '/_design/projects/_view/index').then(function(response) {
				var retval = [];
				for (var i in response.data.rows) {
					retval.push(response.data.rows[i].value);
				}
				return retval;
			});
		},
		
		getProjectById : function(id) {
			return $http.get(ProJack.config.dbUrl + '/' + id).then(function(response) {
				return response.data;
			});
		},
		
		saveProject : function(project) {
			
			if (project._id && project._rev) {
				// this is an update
				project.dateModified = new Date().getTime();
				return $http.put(ProJack.config.dbUrl + '/' + project._id, project).then(function(response) {
					project._rev = response.data.rev;
					return project;
				});
			} else {
				return $http.post(ProJack.config.dbUrl, project).then(function(response) {
					project._id = response.data._id;
					project._rev= response.data.rev;
				});
			}
		},
		
		deleteProject : function(project) {
			return $http.delete(ProJack.config.dbUrl + '/' + project._id + "?rev=" + project._rev);
		}
	}
}]);