////////////*Сервис*/////////////
myApp.service('user', function(){
       
    var loggedIn = false;
    var currentURL = "/account/profile";
    
    this.isUserLoggedIn = function(){
        
        var autoriz = angular.element(document.querySelector("#autoriz"));
        var account = angular.element(document.querySelector("#account"));

        if(localStorage.getItem("login")){
            loggedIn = true;

            autoriz.css("display", "none");
            account.css("display", "inline");
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

        autoriz.css("display", "inline");
        account.css("display", "none");
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
        
        var username_input = angular.element(document.querySelector('#Username'));
        var username_feedback = angular.element(document.querySelector('#feedback-username'));
        var email_input = angular.element(document.querySelector('#Email'));
        var email_feedback = angular.element(document.querySelector('#feedback-email'));
        var base_text_feedback = "Данное поле обязательно для заполнения";
        var form = document.getElementById("form");
        var data = {};

        if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                username_feedback.text(base_text_feedback);
                email_feedback.text(base_text_feedback);
                form.classList.add("was-validated");
        }
        else{
            data.username = $scope.username;
            data.email    = $scope.email;
            data.photoURL = path;
            data.type_file= type_file;
            data.date     = moment($scope.date).format("YYYY-MM-DD");
            data.city     = $scope.city;
            data.password = $scope.password;

            form.classList.remove("was-validated");
            $http.post("http://localhost:3000/registration", data).then(function (result) {
                    if(!result.data.check_username){
                        username_input.addClass('is-invalid');
                        username_feedback.text("Данное имя пользователя уже занято");
                    }
                    else{
                        username_input.removeClass('is-invalid');
                    }

                    if(!result.data.check_email){
                        email_input.addClass('is-invalid');
                        email_feedback.text("Данный адрес электронной почты уже занят")
                    }
                    else{
                        email_input.removeClass('is-invalid');
                    }

                    if(result.data.reg){
                          $scope.message = true;
                    }    
            });
        }
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
    
    $scope.loggIn = function(event){
        
        var form = document.getElementById("needs-validation");
        var path = user.isCurrentURL();

        if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                form.classList.add("was-validated");
        }
        else{
                var data = {
                    username: $scope.username,
                    password: $scope.password
                };
                $http.post("http://localhost:3000/autorization", data).then(function (result) {
                    if(result.data.loggedIn == true){
                        user.saveData(result.data);
                        $location.path(path);    
                    }
                });
        }
    }
});

myApp.controller("AccountMemuCtl", function($scope, user){
    if(user.checkRoots()){
        $scope.access = true;
    }
});

myApp.controller("profileController", function($scope, $http, user){
   
   $scope.nav_account = {page: 1};
   moment.locale('ru');

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
        $scope.Date     = moment(result.data.date_birth).format("DD MMMM YYYY г.");
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

    $http.get("http://localhost:3000/getListUsers/"+user.getIdCurrentUser()).then(function(result){
        $scope.usernames = result.data;
    });

    $scope.changeUserPassword = function(){
        var form = document.getElementById("needs-validation");
        var data = {};
        
        if(!form.checkValidity()){
            event.preventDefault();
            event.stopPropagation();
            form.classList.add("was-validated");
        }
        else{
            data.user_id = user.getIdCurrentUser();
            data.username = $scope.selectedUsername;
            data.newUserPassword = $scope.newUserPassword;

            $http.put("http://localhost:3000/changeUserPassword", data);
        }
    }
})

myApp.controller("changeDataController", function($scope, $http, user){
    $scope.nav_account = {page: 4};

    $scope.showBlock = function(arg){
        $scope.link = arg;
    }

    $scope.hideBlock = function(arg){
        var form = document.getElementById("needs-validation"+arg);
        form.classList.remove("was-validated");
        if(arg == 1){
            $http.get("http://localhost:3000/getUserInfo/"+user.getIdCurrentUser()).then(function(result){ 
                $scope.username = result.data.username;
                $scope.date_birth = new Date(moment(result.data.date_birth));
                $scope.city = result.data.city;
            });
        }
        $scope.link = 0;
    }

    $scope.updateUserInfo = function(){
        var form = document.getElementById("needs-validation1");
        var data = {};

        if (form.checkValidity() == false) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add("was-validated");
        }
        else{
            data.user_id = user.getIdCurrentUser();
            data.username = $scope.username;
            data.date_birth = moment($scope.date_birth).format("YYYY-MM-DD");
            data.city = $scope.city; 
            $http.put("http://localhost:3000/account/updateUserInfo", data);
        }
    }

    $scope.savePassword = function(){
        var form = document.getElementById("needs-validation3");
        var data = {};

        if (form.checkValidity() == false) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add("was-validated");
        }
        else{
            data.user_id = user.getIdCurrentUser();
            data.password = $scope.password; 
            $http.put("http://localhost:3000/account/change-password", data);
        }
    }

    $scope.saveEmail = function(){
        var form = document.getElementById("needs-validation2");
        var data = {};
        if (form.checkValidity() == false) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add("was-validated");
        }
        else{
            data.user_id = user.getIdCurrentUser();
            data.email = $scope.email; 
            $http.put("http://localhost:3000/account/change-email", data)
        }
    }

    $http.get("http://localhost:3000/getUserInfo/"+user.getIdCurrentUser()).then(function(result){ 
        $scope.username = result.data.username;
        $scope.date_birth = new Date(moment(result.data.date_birth));
        $scope.city = result.data.city;
    });
})

myApp.controller("supportController", function($scope, $http){

    $scope.sendSupport = function(event){
        var form = document.getElementById("needs-validation");

        if (form.checkValidity() == false) {
                event.preventDefault();
                event.stopPropagation();
        }
        else{
            var data = {
                    username: $scope.username,
                    email: $scope.email,
                    typeProblem: $scope.type_problem,
                    problem: $scope.problem

            }
            $http.post("http://localhost:3000/support", data).then(function(result){
                console.log(result.data);
            })
        }
        form.classList.add("was-validated");
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