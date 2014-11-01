ProJack.templates.service("TemplateService", ['$http', '$q', 'KT', function($http, $q, KT) {

	return {
		newTemplate : function() {
			return {
				type : 'template',
				name : ""
			};
		},
		
		getAllTemplates : function() {
			return $http.get(ProJack.config.dbUrl + "/_design/templates/_view/index")
				.then(function(response) {
					var retval = [];
					for (var i in response.data.rows) {
						retval.push(response.data.rows[i].value);
					}
					return retval;
				});
		},
		
		createTemplate : function(template, file) {
			if (!file) return;
		
			var deferred = $q.defer();
			
			var fr = new FileReader();
			fr.readAsDataURL(file);
			fr.onload = function(e) {
				if (!template._attachments)
					template._attachments = {};
				
				template._attachments[file.name] = {};
				template._attachments[file.name]['content_type'] = file.type;
				template._attachments[file.name]['data'] = fr.result.split(",")[1];
				
				return $http.post(ProJack.config.dbUrl, template)
					.success(function(response) {
						deferred.resolve({name : template.name, filename : file.name, type : file.type, length : file.size || 0});
					})
					.error(function(response) {
						deferred.reject(response.data);
					});
			}
			return deferred.promise;
		},
		
		deleteTemplate : function(template) {
			return $http({
				method : 'DELETE',
				url    : ProJack.config.dbUrl + "/" + template._id + "?rev=" + template._rev
			}).then(function(response) {
				return response.data;
			});
		}
	}
}]);
