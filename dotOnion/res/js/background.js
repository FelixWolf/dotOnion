var settings = new (function(){
    var _settings = JSON.parse(window.localStorage["proxySettings"]||"{}");
    this.get = function(key, fallback){
        if(key in _settings)
            return _settings[key];
        return fallback;
    }
    this.set = function(key, value){
        _settings[key] = value;
        window.localStorage["proxySettings"] = JSON.stringify(_settings);
    }
    this.delete = function(key, value){
        delete _settings[key];
        window.localStorage["proxySettings"] = JSON.stringify(_settings);
    }
})();

document.addEventListener("DOMContentLoaded", function () {
    chrome.proxy.settings.set(
        settings.get("proxy")
    );
});
