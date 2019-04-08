var myApp = angular.module('myApp', ['ngRoute', 'ngCookies'])
   .config(function($routeProvider, $httpProvider,$locationProvider){

    $routeProvider
    .when('/', {
        resolve: {
            check: function($http, user){
                if(localStorage.getItem("login")){
                     $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                        if(!result.data.answer){
                            user.clearData();
                        }
                     })
                }
            }
        },
    	templateUrl: "../pages/main.html",
    	controller: "mainController"
    })

    .when('/determination', {
        resolve: {
            check:  function($location, $http, user){
                        if(!user.isUserLoggedIn()){
                            user.currentURL($location.path());
                            $location.path("/autorization");
                        }
                        if(localStorage.getItem("login")){
                            $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                                if(!result.data.answer){
                                    user.clearData();
                                    $location.path("/autorization");
                                }
                            })
                        }
                    },
        },
        templateUrl: "../pages/determination.html",
        controller: "determinationController"
    })

    .when('/account/profile', {
        resolve: {
            check:  function($location, $http, user){
                        if(!user.isUserLoggedIn()){
                            user.currentURL($location.path());
                            $location.path("/autorization");
                        }
                        if(localStorage.getItem("login")){
                            $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                                if(!result.data.answer){
                                    user.clearData();
                                    $location.path("/autorization");
                                }
                            })
                        }
                    },
        },
        templateUrl: "../pages/account.html",
        controller: "profileController"
    })

    .when('/account/history-determ', {
        resolve: {
            check:  function($location, $http, user){
                        if(!user.isUserLoggedIn()){
                            user.currentURL($location.path());
                            $location.path("/autorization");
                        }
                        if(localStorage.getItem("login")){
                            $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                                if(!result.data.answer){
                                    user.clearData();
                                    $location.path("/autorization");
                                }
                            })
                        }
                    },
        },
        templateUrl: "../pages/account.html",
        controller: "showHisrotyController"
    })

    .when('/account/change-data', {
        resolve: {
            check:  function($location, $http, user){
                        if(!user.isUserLoggedIn()){
                            user.currentURL($location.path());
                            $location.path("/autorization");
                        }
                        if(localStorage.getItem("login")){
                            $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                                if(!result.data.answer){
                                    user.clearData();
                                    $location.path("/autorization");
                                }
                            })
                        }
                    },
        },
        templateUrl: "../pages/account.html",
        controller: "changeDataController"
    })

    .when('/autorization', {
    	templateUrl: "../pages/autoriz.html",
    	controller: "autorizController"
    })

    .when('/registration', {
        templateUrl: "../pages/registration.html",
        controller: "registrController"
    })
    
    .when('/logout', {
        resolve: {
            deadResolve: function($location, user){
                            user.clearData();
                            $location.path('/autorization');
                        }
        }
    })
    
    .when('/recovery', {
        templateUrl: "../pages/recoveryPassword.html",
        controller: "recoveryController"
    })

    .when('/support', {
        resolve: {
            check: function($http, user){
                if(localStorage.getItem("login")){
                     $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                        if(!result.data.answer){
                            user.clearData();
                        }
                     })
                }
            }
        },
        templateUrl: "../pages/support.html",
        controller: "supportController"
    })
    
    .otherwise({
		redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});


