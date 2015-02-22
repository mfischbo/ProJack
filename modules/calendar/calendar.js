/**
 * Calendar Module
 * Displays the timefeed (milestones, other events) in a table and generates reports
 * @author: M.Fischboeck
 */
ProJack.calendar = angular.module("CalendarModule", ['Utils', 'MileStonesModule', 'TemplateModule', 'SecurityModule']);
ProJack.calendar.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/calendar', {
            controller : 'CalendarIndexController',
            templateUrl : './modules/calendar/views/index.html'
        });
}]);