ProJack.mails.service("MailService", ['$http', '$q', 'KT', function($http, $q, KT) {

	return {
		getMessages : function(login, password, host, folder, offset, length) {

			var def = $q.defer();
			var that = this;
			$http.get(ProJack.config.serviceUrl + "/mailbox/messages/" + folder + "?login=" + login + "&password=" + password + "&host=" +host+ "&offset=" +offset+ "&length=" +length)
				.then(function(response) {
					def.resolve(response.data);
			});
			return def.promise;
		}
	}
}]);
