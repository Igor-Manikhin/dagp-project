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
    var path;
    var type_file;
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
        
        var data = {};
        data.username = $scope.username;
        data.email    = $scope.email;
        data.photoURL = path;
        data.type_file= type_file;
        data.date     = $scope.date;   
        data.city     = $scope.city;
        data.password = $scope.password;

        form.classList.remove("was-validated");
        $http.post("http://localhost:3000/registration", data).then(function Success(result) {
            if(result.data.reg){
                $scope.message = true;
            }    
        }, function Error(result){
            var errors = result.data.errors;
            console.log(result.data.errors);

            for(property in errors){
                if(errors[property]){
                    angular.element(document.querySelector('#'+property)).addClass('is-invalid');
                    angular.element(document.querySelector('#feedback-'+property)).text(errors[property].msg);
                }
            }
        });
    }
});

myApp.controller("recoveryController", function($scope){

    $scope.recovery = function(event){
         var form = document.getElementById("form");

         if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
         }
         else{
                var Email = $scope.email;
                var New_password = $scope.password;
         }
         form.classList.add("was-validated");
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

myApp.controller("showUsersStatistics", function($scope){
    $scope.nav_account = {page: 4};
    
    $scope.data = [
            {label: "one", value: 12.2, color: "red"}, 
            {label: "two", value: 45, color: "#00ff00"},
            {label: "three", value: 10, color: "rgb(0, 0, 255)"}
    ];

    /*$scope.gauge_data = [
            {label: "CPU", value: 75, suffix: "%", color: "steelblue"}
    ];*/

    $scope.options = {thickness: 10};
})

myApp.controller("changeDataController", function($scope, $http, user){
    $scope.nav_account = {page: 5};

    $scope.input_check = function(event){
        if($(event.target).value != ""){
            $(event.target).removeClass('is-invalid');
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
        }
        if(arg == 2){
            $scope.email = "";
        }
        if(arg == 3){
            $scope.password = "";
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
            console.log(result.data);
        }, function(result){
            var errors = result.data.errors;
            console.log(errors);
            for(error in errors){
                if(errors[error]){
                    angular.element(document.querySelector('#'+error)).addClass('is-invalid');
                    angular.element(document.querySelector('#feedback-'+error)).text(errors[error].msg);
                }
            }
        })
    }
});

myApp.controller("determinationController", function($scope, $timeout, $http, user){

    var spinner = angular.element(document.querySelector(".loading"));
    var photoURL;
    var type_file;
    var name_file;

    let model;
    (async function(){
            model = await tf.loadLayersModel('backend/neural_network/model.json');
    })();


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

        function age_group(age){
            
            var groups = ["Детская", "Подростковая", "Юношеская", "Взрослая", "Пожилая"];
            var ages_groups = [[0, 12],[13, 18],[19, 25],[26, 40], [41, 55], [56, 75]]; 
            var group_age;

            for(var i = 0; i < ages_groups.length; i++){
                var j = 0;
                if(age>=ages_groups[i][j] && age<=ages_groups[i][j+1]){
                    group_age = groups[i];
                    return group_age;
                }
            }
        }

        var class_names = ["Женский", "Мужской"];
        var res_determ = {};
        var age_group;
        let prediction;

        $scope.age =""; 
        $scope.gender = "";
        $scope.age_group = "";
        
        let image = $("#selected-image").get(0);

        var tracker = new tracking.ObjectTracker("face");
        tracker.setInitialScale(1.03);
        tracker.setStepSize(1.9);
        tracker.setEdgesDensity (0,2);

        tracker.on('track', function(event){
            if(event.data.length != 0){
                spinner.removeClass("d-none").addClass("d-flex");
                let tensor = tf.browser.fromPixels(image)
                      .resizeNearestNeighbor([150,150])   
                      .toFloat()
                      .expandDims();
                tensor = tensor.div(tf.scalar(255));        
                prediction = model.predict(tensor);
                prediction = class_names[prediction.argMax(1).dataSync()[0]];        
                age_group = age_group(18);

                $timeout(function(){
                    $scope.age = 18+" лет"; 
                    $scope.gender = prediction;
                    $scope.age_group = age_group;
                    spinner.removeClass("d-flex").addClass("d-none");
                }, 1500);      

                res_determ.id = user.getIdCurrentUser();
                res_determ.age_determ = 18;
                res_determ.age_group_determ = age_group;
                res_determ.gender_determ = prediction;
                res_determ.photoURL = photoURL;
                res_determ.type_file = type_file;
                res_determ.name_file = name_file;

                $http.post("http://localhost:3000/saveDataHistory", res_determ);
            }
         });

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