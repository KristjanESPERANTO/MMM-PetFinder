/* Magic Mirror
 * Module: MMM-Petfinder
 *
 * By Mykle1
 *
 */
Module.register("MMM-PetFinder", {

    // Module config defaults.
    defaults: {
        apiKey: "",             // Your API key
        apiSecret: "",
        animal: "cat",          // barnyard, bird, cat, dog, horse, reptile, smallfurry
        size: "medium",              // small, medium, large, extra-large
        sex: "female",               // male, female
        location: "10306",      // the ZIP/postal code or city and state the animal should be located
        maxWidth: "300px",
        useHeader: false,
        animationSpeed: 1000,
        initialLoadDelay: 1875,
        retryDelay: 1500,
        rotateInterval: 10 * 60 * 1000, // 10 minutes
        updateInterval: 60 * 60 * 1000, // 1 hour
    },


    getStyles: function() {
        return ["MMM-PetFinder.css"];
    },


    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);


        //  Set locale.
        this.maxCount = 65
        this.url = "http://api.petfinder.com/v2/animals?&type=" + this.config.animal + "&size=" + this.config.size + "&gender=" + this.config.sex + "&location=" + this.config.location + "&limit=" + this.maxCount + "&format=json";
        this.tokenUrl = "https://api.petfinder.com/v2/oauth2/token";
        this.pet = {};
        this.activeItem = 0;
        this.rotateInterval = null;
        this.scheduleUpdate();
    },


    getDom: function() {

        var pf = this.pf; //animals array
        var apiKey = this.config.apiKey;
        var apiSecret = this.config.apiSecret;
        var animal = this.config.animal;
        var size = this.config.size;
        var sex = this.config.sex;
        var location = this.config.location;

        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;


        if (!this.loaded) {
            wrapper.classList.add("wrapper");
            wrapper.innerHTML = "I need a good home...";
            wrapper.className = "bright light small";
            return wrapper;
        }

        // header
        if (this.config.useHeader != false) {
            var header = document.createElement("header");
            header.classList.add("small", "bright", "light", "header");
            header.innerHTML = this.config.header;
            wrapper.appendChild(header);
        }

        // rotation
        if (pf.length > 0) {
            if (this.activeItem >= pf.length) {
                this.activeItem = 0;
            }
            var animal = this.pf[this.activeItem];


            var top = document.createElement("div");
            top.classList.add("list-row");

            // name
            var name = document.createElement("div");
            name.classList.add("small", "bright", "name");
            name.innerHTML = "My name is " + animal.name;
            top.appendChild(name);


            // age, sex and size of animal
            var age = document.createElement("div");
            age.classList.add("small", "bright", "ageSexSize");
            age.innerHTML = animal.age + ", " + animal.gender + ", Size " + animal.size;
            top.appendChild(age);

            // the picture of the pet
            var pic = document.createElement("div");
            var img = document.createElement("img");
            img.classList.add("photo");
            img.src = animal.photos[0].large;
            pic.appendChild(img);
            wrapper.appendChild(pic);


            // location of animal (city, state and zip code)
            var city = document.createElement("div");
            city.classList.add("xsmall", "bright", "location");
            city.innerHTML = "Location - " + animal.contact.address.city + ", " + animal.contact.address.state + " " + animal.contact.address.postcode;
            top.appendChild(city);

            // phone # of facility
            var phone = document.createElement("div");
            phone.classList.add("xsmall", "bright", "phone");
            if (animal.contact.phone == "" || animal.contact.phone == undefined) {
                phone.innerHTML = "";
                top.appendChild(phone);
            } else
                phone.innerHTML = "Phone - " + animal.contact.phone;
            top.appendChild(phone);


            // email contact of facility
            var email = document.createElement("div");
            email.classList.add("xsmall", "bright", "email");
            if (animal.contact.email == "" || animal.contact.email == undefined) {
                email.innerHTML = "";
                top.appendChild(email);
            } else
                email.innerHTML = "Email - " + animal.contact.email;
            top.appendChild(email);

            // description of animal
            var description = document.createElement("div");
            description.classList.add("xsmall", "bright", "description");
            if (animal.description == "" || animal.description == null) {
                description.innerHTML = "";
                top.appendChild(description);
            } else
                description.innerHTML = this.sTrim(animal.description, 187, ' ', ' ...'); // animal.description;.email;
            top.appendChild(description);
    }

        wrapper.appendChild(top);


        return wrapper;

        

    },


    /////  Add this function to the modules you want to control with voice //////

    notificationReceived: function(notification, payload) {
        if (notification === 'HIDE_PETFINDER') {
            this.hide(1000);
        } else if (notification === 'SHOW_PETFINDER') {
            this.show(1000);
        }

    },

    scheduleCarousel: function() {
        this.rotateInterval = setInterval(() => {
            this.activeItem++;
            this.updateDom(this.config.animationSpeed);
        }, this.config.rotateInterval);
    },


    processPetFinder: function(data) {
        // this.today = data.Today;
        this.pf = data.animals; // SpaceCowboysDude
        this.loaded = true;
    },

    // call this fucktion to shorten long text ( see description tag)
    sTrim: function(str, length, delim, appendix) {
        if (str.length <= length) return str;
        var trimmedStr = str.substr(0, length + delim.length);
        var lastDelimIndex = trimmedStr.lastIndexOf(delim);
        if (lastDelimIndex >= 0) trimmedStr = trimmedStr.substr(0, lastDelimIndex);
        if (trimmedStr) trimmedStr += appendix;
        return trimmedStr;
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getToken();
        }, this.config.updateInterval);
        this.getToken(this.config.initialLoadDelay);
    },

    getToken: function() {
        this.sendSocketNotification('TOKEN', {url: this.tokenUrl, clientID: this.config.apiKey, clientSecret: this.config.apiSecret});
    },

    getPetFinder: function(token) {
        this.sendSocketNotification('GET_PETFINDER', { 'url': this.url, 'token': token });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "TOKEN") {
            this.getPetFinder(payload);
        }
        if (notification === "ANIMALS") {
            this.processPetFinder(payload);
                if (this.rotateInterval == null) {
                this.scheduleCarousel();
            }
            this.updateDom(this.config.animationSpeed);
        }
        this.updateDom(this.config.initialLoadDelay);
    },

});
