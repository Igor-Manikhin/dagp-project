////////////*Сервис*/////////////
myApp.service('user', function(){
       
    var loggedIn = false;
    var currentURL = "/account/profile";
    
    this.isUserLoggedIn = function(){
        
        var autoriz = angular.element(document.querySelector("#autoriz"));
        var account = angular.element(document.querySelector("#account"));

        if(localStorage.getItem("login")){
            loggedIn = true;

            autoriz.addClass("d-none");
            account.removeClass("d-none");
        }

        return loggedIn;
    } 
    
    this.saveData = function(data){
        localStorage.setItem("login", JSON.stringify({
            root_admin: data.root_admin,
            user_id: data.token
        }))
    }

    this.saveUserInfo = function(data){
        localStorage.setItem("UserInfo", JSON.stringify({
            photoURL: data.photoURL,
            username: data.username,
            Email: data.Email
        }))
    }

    this.checkRoots = function(){
        var data = JSON.parse(localStorage.getItem("login"));
        return data.root_admin;
    }

    this.getIdCurrentUser = function(){
        var data = JSON.parse(localStorage.getItem("login"));
        var user_id = data.user_id;
        return user_id;
    }

    this.clearData = function() {
        var autoriz = angular.element(document.querySelector("#autoriz"));
        var account = angular.element(document.querySelector("#account"));

        localStorage.removeItem('login');
        localStorage.removeItem('UserInfo');

        loggedIn = false;

        autoriz.removeClass("d-none");
        account.addClass("d-none");
    }

    this.currentURL = function(url){
        currentURL = url;
    }

    this.isCurrentURL = function(){
        return currentURL;
    }
})


////*Контроллеры для шаблонов страниц веб-сервиса*////
myApp.controller("mainController", function($scope){

});

myApp.controller("registrController", function($scope, $location, $http){
    var path; //Путь, по которому расположена фотография в формате Base64 
    var type_file; //Формат фотографии
    $scope.message = false;

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $(event.target).removeClass('is-invalid');
        }
    }

    $scope.readURL = function(input) {
        if (input.files && input.files[0]) {
            
            var reader = new FileReader();

            reader.onload = function (e) {
                type_file = input.files[0].type;
                path = e.target.result;
            }

            reader.readAsDataURL(input.files[0]);
        }
    };

    $scope.registr = function(event){
        
        var data = {}; //Объект хранения данных, указанных пользователем при регистрации нового аккаунта
        data.username = $scope.username; //Занесение имени пользователя, указанного при регистрации нового аккаунта, в объект "data"
        data.email    = $scope.email; //Занесение адреса электронной почты, указанной при регистрации нового аккаунта, в объект "data"
        data.photoURL = path; //Занесение пути указанной фотографии во время регистрации нового аккаунта, в объекта "data"
        data.type_file= type_file; //Занесение формата фотографии, указанной во время регистрации нового аккаунта, в объекта "data"
        data.date     = $scope.date; //Занесение даты рождения, указанной во время регистрации нового аккаунта, в объекта "data"
        data.city     = $scope.city; //Занесение города проживания пользователя, указанного во время регистрации нового аккаунта, в объекта "data"
        data.password = $scope.password; //Занесение пароля от личного аккаунта, указанного во время регистрации нового аккаунта, в объекта "data"

        form.classList.remove("was-validated");
        $http.post("http://localhost:3000/registration", data).then(function Success(result) {
            //Если пришёл ответ с сервера со значением "true"
            if(result.data.reg){
                //Вывести сообщение об успешной регистрации нового аккаунта на веб-сервисе
                $scope.message = true;
            }
        //В случае неправильного заполнения данных при регистрации нового аккаунта на веб-сервисе    
        }, function Error(result){
            var errors = result.data.errors; //Ошибки, полученные в виде ответа с сервера об не успешной регистрации нового аккаунта
            console.log(result.data.errors);
            //Выделить поля, в которых были допущены ошибки или которые не были заполнены как обязательные
            for(property in errors){
                if(errors[property]){
                    angular.element(document.querySelector('#'+property)).addClass('is-invalid');
                    angular.element(document.querySelector('#feedback-'+property)).text(errors[property].msg);
                }
            }
        });
    }
});

myApp.controller("recoveryController", function($scope, $http){

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $(event.target).removeClass('is-invalid');
        }
    }

    $scope.recovery = function(event){
        var data = {};
        data.email = $scope.email;
        data.password = $scope.new_password;

        $http.post("http://localhost:3000/recoveryPassword", data).then(function(result){
            $scope.answer = result.data.answer; 
        }, function(result){
            var errors = result.data.errors;

            for(error in errors){
                angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                angular.element(document.querySelector('#feedback-'+error)).text(errors[error].msg);
            }
        })
    }
});

myApp.controller("autorizController", function($scope, $location, $http, user){

    var username = angular.element(document.querySelector('#username'));
    var password = angular.element(document.querySelector('#password'));
    var validation_feedback = angular.element(document.querySelector('#invalid-feedback'));

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $scope.show_mode = false;
            username.removeClass('is-invalid');
            password.removeClass('is-invalid');
        }
    }
    
    $scope.loggIn = function(event){
        
        var path = user.isCurrentURL();
        var data = {};

        data.username = $scope.username;
        data.password =  $scope.password;

        $http.post("http://localhost:3000/autorization", data).then(function(result){
            if(result.data.loggedIn == true){
                user.saveData(result.data);
                $location.path(path);    
            }
        }, function(result){
            var errors = result.data.errors;
            var count_errors = 0;
            $scope.show_mode = true;

            for(error in errors){
                if(errors[error].value == undefined){
                    if(error == "data_message_error"){
                        username.addClass('is-invalid');
                        password.addClass('is-invalid');
                        return validation_feedback.html(errors.data_message_error.msg);
                    }
                    angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                    validation_feedback.html(errors[error].msg);
                    count_errors++;
                }
                if(errors[error].value != undefined){
                    angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                    return validation_feedback.html(errors[error].msg);
                }
                if(count_errors == 2){
                    validation_feedback.html("Введите имя пользователя<br>(или адрес электронной почты) и пароль");
                }
            }
        });
    }
});

myApp.controller("AccountMemuCtl", function($scope, user){
    if(user.checkRoots()){
        $scope.access = true;
    }
});

myApp.controller("profileController", function($scope, $http, user){
   
   $scope.nav_account = {page: 1};

   $scope.readURL = function(input) {
        var data = {};

        if (input.files && input.files[0]) {
            
            var reader = new FileReader();
            reader.onload = function (e) {
                data.user_id  = user.getIdCurrentUser();
                data.image_path = e.target.result;
                data.type_file = input.files[0].type;
                data.name_file = input.files[0].name;
                $(".modal").modal("hide");

                $http.put("http://localhost:3000/account/profile/changeImage", data).then(function(result){
                    $scope.photoURL = result.data;
                });
            }

            reader.readAsDataURL(input.files[0]);
        }
    };

    $http.get("http://localhost:3000/getUserInfo/"+user.getIdCurrentUser()).then(function(result){
        $scope.photoURL = result.data.photoURL;
        $scope.username = result.data.username;
        $scope.Email    = result.data.Email;
        $scope.Date     = new Date(result.data.date_birth).toLocaleString("ru", {year: 'numeric', month: 'long', day: 'numeric'});
        $scope.City     = result.data.city;
    });
});

myApp.controller("showHisrotyController", function($scope, $http, user){
    
    $scope.nav_account = {page: 2};

    $http.get("http://localhost:3000/getHistoryUser/"+user.getIdCurrentUser()).then(function(result){
        if(result.data.length > 0){
            $scope.history = result.data.slice().reverse();
            $scope.history_determ = true;
        };
    });
});

myApp.controller("changePasswordsUsers", function($scope, $http, user){
    $scope.nav_account = {page: 3};

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $(event.target).removeClass('is-invalid');
            $scope.update_user_info = false;
        }
    }

    $http.get("http://localhost:3000/getListUsers/"+user.getIdCurrentUser()).then(function(result){
        $scope.usernames = result.data;
    });

    $scope.changeUserPassword = function(){
        var data = {};
        
        data.user_id = user.getIdCurrentUser();
        data.username = $scope.selectedUsername;
        data.password = $scope.newUserPassword;

        $http.put("http://localhost:3000/changeUserPassword", data).then(function(result){
            $scope.update_user_info = result.data.answer;
            $scope.message = result.data.message;
        }, function(result){
            var errors = result.data.errors;
            for(error in errors){
                if(errors[error]){
                    angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                    angular.element(document.querySelector('#feedback-'+error)).text(errors[error].msg);
                }
            }
        });
    }
})

myApp.controller("showUsersStatistics", function($scope, $http, user){
    $scope.nav_account = {page: 4};

    var graph = null;

    $http.get("http://localhost:3000/getListUsers/"+user.getIdCurrentUser()).then(function(result){
        $scope.usernames = result.data;
    });

    $scope.showUserStatistics = function(){
        var type_graphic = angular.element(document.querySelector("#type_graphic")).val();
        var graphic = document.getElementById('Graphic');
        var data = {};
        var options;
        var url;

        if(graph != null){
            var ctx = graphic.getContext('2d');
            ctx.clearRect(0, 0, graphic.width, graphic.height);
            graph.destroy();
        }

        if(type_graphic == 1){
            url = '/getHistoryVisitsUser?id=';
            options = {
                    type: 'bar',
                    data: {
                        datasets: [{
                            fill: false,
                            backgroundColor: "#4a8ee3" 
                        }],

                    },
                    options: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Статистика пользователя '+$scope.selectedUsername
                        },
                        scales: {
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: "Число посещений веб-сервиса за день"
                                },
                                ticks: {
                                    stepSize: 1,
                                    beginAtZero: true
                                }
                            }]
                        }
                    }
            };            
        }
        if(type_graphic == 2){
            url = '/getStatisticsOfUseFunctional?id=';
            options = {
                    type: 'doughnut',
                    data: {
                            datasets: [{
                                backgroundColor: ["#4A8EE3", "#98AFC7", "#B6B6B4"],
                                borderColor: ["#4A8EE3", "#98AFC7", "#B6B6B4"],
                                borderWidth: 1
                            }],
                    },
                    options: {
                            layout: {
                                padding: {
                                    right: 100
                                }
                            },
                            legend: {
                                display: true,
                                position: 'right'
                            },
                            title: {
                                display: true,
                                text: 'Статистика пользователя '+$scope.selectedUsername
                            }
                    }
            };
        }

        $http.get("http://localhost:3000"+url+user.getIdCurrentUser()+"&username="+$scope.selectedUsername).then(function(result){
            options.data.labels = result.data.labels;
            options.data.datasets[0].data = result.data.data;
            graph = new Chart(graphic.getContext('2d'), options);
        }, function(result){
            var errors = result.data.errors;
            for(error in errors){
                angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                angular.element(document.querySelector('#feedback-'+error)).text(errors[error].msg);
            }
        })
    }
})

myApp.controller("changeDataController", function($scope, $http, user){
    $scope.nav_account = {page: 5};

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $(event.target).removeClass('is-invalid');
            $scope.update_user_info = false;
        }
    }

    $scope.showBlock = function(arg){
        $scope.link = arg;
    }

    $scope.hideBlock = function(arg){
        var feedbacks = document.getElementsByClassName('input');
        for(var i = 0; i < feedbacks.length; i++){
            feedbacks[i].classList.remove("is-invalid");
        }

        if(arg == 1){
            $http.get("http://localhost:3000/getUserInfo/"+user.getIdCurrentUser()).then(function(result){ 
                $scope.username = result.data.username;
                $scope.date_birth = new Date(result.data.date_birth);
                $scope.city = result.data.city;
            });
            $scope.update_user_info = false; 
        }
        if(arg == 2){
            $scope.email = "";
            $scope.update_user_info = false;
        }
        if(arg == 3){
            $scope.password = "";
            $scope.update_user_info = false;
        }

        $scope.link = 0;
    }

    $scope.updateUserInfo = function(arg, url){
        var data = {};
        data.user_id = user.getIdCurrentUser();

        if(arg == 1){
            data.username = $scope.username;
            data.date_birth = $scope.date_birth;
            data.city = $scope.city; 
        }
        if(arg == 2){
            data.email = $scope.email;     
        }
        if(arg == 3){
            data.password = $scope.password;    
        }

        $http.put("http://localhost:3000/account" + url, data).then(function(result){
            $scope.update_user_info = result.data.update;
            $scope.message = result.data.message;
        }, function(result){
            var errors = result.data.errors;

            for(error in errors){
                if(errors[error]){
                    angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                    angular.element(document.querySelector('#feedback-'+error)).text(errors[error].msg);
                }
            }
        });
    }

    $http.get("http://localhost:3000/getUserInfo/"+user.getIdCurrentUser()).then(function(result){ 
        $scope.username = result.data.username;
        $scope.date_birth = new Date(result.data.date_birth);
        $scope.city = result.data.city;
    });
})

myApp.controller("supportController", function($scope, $http){

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $(event.target).removeClass('is-invalid');
        }
    }

    $scope.sendSupport = function(event){
        var data = {};

        data.username = $scope.username;
        data.email = $scope.email;
        data.type_problem = $scope.type_problem;
        data.description_problem = $scope.problem;

        $http.post("http://localhost:3000/support", data).then(function(result){
            $scope.answer = result.data.answer;
        }, function(result){
            var errors = result.data.errors;

            for(error in errors){
                if(errors[error]){
                    angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                    angular.element(document.querySelector('#feedback-'+error)).text(errors[error].msg);
                }
            }
        })
    }
});
//Контроллер страницы определения возраста, возрастной группы и пола человека по изображению лица 
myApp.controller("determinationController", function($scope, $timeout, $http, user){

    var spinner = angular.element(document.querySelector(".loading")); 
    var message_error = angular.element(document.querySelector(".message_error")); 
    var data_image = {}; 
    var photoURL; 
    var type_file; 
    var name_file;

    $scope.readURL = function(input) { 
        if (input.files && input.files[0]) { 
            var reader = new FileReader(); 
            reader.onload = function (e) { 
                $('#selected-image').attr('src', e.target.result); 
                photoURL = e.target.result; 
                type_file = input.files[0].type; 
                name_file = input.files[0].name; 
            } 

            reader.readAsDataURL(input.files[0]); 
        } 
    }; 

    $scope.determ = async function(){ 

        $scope.age =""; 
        $scope.gender = ""; 
        $scope.age_group = ""; 

        message_error.addClass("d-none"); 
        let image = $("#selected-image").get(0); 
        var tracker = new tracking.ObjectTracker("face"); 
        tracker.setInitialScale(1.03); 
        tracker.setStepSize(1.9); 
        tracker.setEdgesDensity (0,2); 

        tracker.on('track', function(event){ 
            if(event.data.length != 0){ 
                data_image.id = user.getIdCurrentUser();
                data_image.photoURL = photoURL; 
                data_image.type_file = type_file; 
                data_image.name_file = name_file;
                $http.post("http://localhost:3000/determination", data_image).then(function(result){ 
                    $scope.age = result.data.age+" лет"; 
                    $scope.gender = result.data.gender; 
                    $scope.age_group = result.data.age_group;  
                    spinner.removeClass("d-flex").addClass("d-none"); 
                });  
            } 
            else{ 
                message_error.removeClass("d-none"); 
                spinner.removeClass("d-flex").addClass("d-none"); 
            } 
        }); 
        spinner.removeClass("d-none").addClass("d-flex");   
        tracking.track(image, tracker); 
    }
});


myApp.controller('SidebarController', function($scope, $location) {    
    var navMain = $(".navbar-collapse");
    navMain.on("click", "a", function (){
            navMain.collapse('hide');
    });

    $scope.isActive = function (viewLocation) { return viewLocation === $location.path(); };
    
    $scope.about = function(){
        var path = $location.path();
        if(path == "/"){
            var _href = $("a[href='#about']").attr("href");
            $("html, body").animate({scrollTop: $(_href).offset().top+"px"});
            return false;
        }
        else{
            $location.path("/");
        }
    }
});

myApp.run(function($http, $location, user){
    if(localStorage.getItem("login")){
            $http.get("http://localhost:3000/check/"+user.getIdCurrentUser()).then(function(result){
                path = $location.path();

                if(!result.data.answer){
                    var paths = result.data.links;
                    user.clearData();
                    
                    for(var i = 0; i < paths.length; i++){
                        if(path == paths[i]){
                            $location.path("/autorization");
                        }
                    }
                }
                else{
                    user.isUserLoggedIn();
                }
            });
    }
});