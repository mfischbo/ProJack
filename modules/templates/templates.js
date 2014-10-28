ProJack.templates = angular.module("TemplateModule", ['Utils', 'angularFileUpload']);
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
						deferred.resolve({filename : file.name, type : file.type, length : file.size || 0});
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

ProJack.templates.controller("TemplateIndexController", ['$scope', '$upload', 'TemplateService', 'KT', function($scope, $upload, service, KT) {

	$scope.template = service.newTemplate();
	
	service.getAllTemplates().then(function(data) {
		$scope.templates = data;
	});
	
	$scope.onTemplateSelect = function($file) {
		$scope.file = $file[0];
	};
	
	$scope.saveTemplate = function() {
		service.createTemplate($scope.template, $scope.file);
	};
	
	$scope.removeTemplate = function(t) {
		service.deleteTemplate(t).then(function() {
			KT.remove("_id", t._id, $scope.templates);
			KT.alert("Template wurde erfolgreich entfernt");
		});
	}
}]);


ProJack.templates.directive("templateSelector", ['TemplateService', 'KT', function(service, KT) {
	return {
		restrict : 		'A',
		scope : {
			'selectAs' : '=selectAs'
		},
		template : '<div class="form-group">'
			+ '<select data-ng-model="selectAs" data-ng-options="t._id as t.name for t in templates" class="form-control">'
			+ '</select>'
			+ '</div>',
			
		link : function(scope, element, attrs) {
			service.getAllTemplates().then(function(data) {
				scope.templates = data;
			})
		}
	};
}]);