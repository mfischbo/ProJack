ProJack.reminder.service('ReminderService', ['$http', function($http) {

	return {
		
		newReminder : function() {
			return {
				type		: 'reminder',
				description : '',
				alertAt		: new Date(),
				alertTime	: '',
				deleted		: false
			}
		},
		
		
		getAllActiveReminders : function() {
			var x = new Date();
			var startKey = '[1983,7,3,8,28]'; // hrhr
			var endKey   = '[' + x.getFullYear() + ',' + (x.getUTCMonth() + 1) + ',' + x.getUTCDate() + ',' + (x.getUTCHours() + 1) + ',' + x.getUTCMinutes() + ']';
			
			return $http.get(ProJack.config.dbUrl + '/_design/timefeed/_view/reminders?startkey=' + startKey + '&endkey=' + endKey)
				.then(function(response) {
					retval = [];
					for (var i in response.data.rows)
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
		
		createReminder : function(reminder) {
			return $http.post(ProJack.config.dbUrl, reminder).then(function(response) {
				return response.data;
			});
		},
		
		deleteReminder : function(reminder) {
			return $http({
				method  : 'DELETE',
				url		: ProJack.config.dbUrl + '/' + reminder._id + '?rev=' + reminder._rev
			});
		}
	};
}]);