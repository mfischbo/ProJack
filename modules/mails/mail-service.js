ProJack.mails.service("MailService", ['$http', '$q', 'KT', function($http, $q, KT) {

	return {
		
		getFolders : function(login, password, host) {
			KT.enableSpinner();
			return $http.get(ProJack.config.serviceUrl + "/mailbox/folders?login=" + login + "&password=" + password + "&host=" + host)
				.then(function(response) {
					KT.disableSpinner();
					return response.data;
				})
		},
		
		getMessages : function(login, password, host, folder, offset, length) {
			KT.enableSpinner();
			return $http.get(ProJack.config.serviceUrl + "/mailbox/messages/" + folder + "?login=" + login + "&password=" + password + "&host=" +host+ "&offset=" +offset+ "&length=" +length)
				.then(function(response) {
					KT.disableSpinner();
					return response.data;
				});
		}
	}
}]);
