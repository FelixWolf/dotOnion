function i18nProcessor(i18nData){
    var getI18nValue;
    if(typeof(i18nData)=="object")
        getI18nValue = function(n){
            return typeof(i18nData[n])=="string"?i18nData[n]:"!!I18N_UNDEFINED["+n+"]!!";
        }
    else if(typeof(i18nData)=="function")
        getI18nValue = i18nData;
    else
        throw Error("Expected function(key) or object");
    
    var reparsing=false;
    var processI18n = function(){
        if(reparsing)return;
        reparsing=true;
        var elms = document.body.querySelectorAll("*[data-i18n]");
        for(var i=0;i<elms.length;i++){
            elms[i].innerHTML = getI18nValue(elms[i].getAttribute("data-i18n"));
        }
        reparsing=false;
    }
    if (document.readyState == "complete" || document.readyState == "loaded" || document.readyState == "interactive"){
        processI18n();
        document.body.addEventListener('DOMSubtreeModified', function(){
            if(!reparsing)
                processI18n();
        }, false);
    }else{
        document.addEventListener("DOMContentLoaded", function(){
            processI18n();
            document.body.addEventListener('DOMSubtreeModified', function(){
                if(!reparsing)
                    processI18n();
            }, false);
        });
    }
}
function getElements(li){
    var result = {};
    for(var i in li)
        result[li[i]] = document.getElementById(li[i]);
    return result;
}
function smoothScroll(element, rate, pos){
    var start = element.scrollLeft, currentOffset = 0,
        prevTime = +new Date();
    function frame(){
        var delta = (+new Date())-prevTime;
        prevTime = prevTime + delta;
        currentOffset = currentOffset + (delta/rate);
        if(currentOffset>1){
            element.scrollLeft = pos;
        }else{
            element.scrollLeft = start + (Math.sin(currentOffset*(Math.PI/2))*(pos-start));
            window.requestAnimationFrame(frame);
        }
    }
    frame();
}
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

function updateProxy(callback){
    callback = callback||function(){};
    
    var proxy = "";
    if(settings.get("useLocal"))
        proxy="127.0.0.1"+parseInt(settings.get("lport",9050)).toString();
    else{
        proxy = proxy + settings.get("ehost","127.0.0.1").replace("\n","\\n").replace("\"","\\\"").replace(" ","");
        proxy = proxy + ":" + parseInt(settings.get("eport",9050)).toString()
    }
    
    var pScript = "function FindProxyForURL(url, host){try{if(host.split(\".\").pop().toLowerCase()==\"onion\"){return \"SOCKS5 "+proxy+"\";}";
    if(settings.get("enableExit"))
        pScript = pScript + "else if(host.split(\".\").pop().toLowerCase()==\"exit\"){return \"SOCKS5 "+proxy+"\";}"
    pScript = pScript + "}catch(err){return \"DIRECT\";}return \"DIRECT\";}";
    
    var proxy = {
        value: {
            mode: "pac_script",
            pacScript: {
                data: pScript,
                mandatory: false
            }
        },
        scope: 'regular'
    };
    
    settings.set("proxy", proxy);
    
    chrome.proxy.settings.set(proxy,
        callback
    );
}

document.addEventListener('DOMContentLoaded', function(){
    var elms = getElements([
        "navigation","menus","proxyTypeLocal","proxyTypeExternal",
        "settingsForLocal","settingsForExternal","settingTorPortLocal",
        "settingTorHostExternal","settingTorPortExternal",
        "settingProxyEnableExit","testConnection","needsConfigure",
        "ipPublic", "ipTor"
    ]);
    
    //VERY BASIC settings checking, this should be done in a better way
    if(window.localStorage["proxySettings"] == undefined)
        elms.needsConfigure.style.display="block";
    
    //Navigation
    elms.navigation.children[0].setAttribute("class","selected");
    elms.navigation.addEventListener("click", function(e){
        if(e.target.nodeName == "BUTTON"){
            for(var i=0,l=elms.navigation.children.length;i<l;i++)
                elms.navigation.children[i].removeAttribute("class");
            smoothScroll(elms.menus, 500, elms.menus.clientWidth*parseInt(e.target.getAttribute("data-menuOffset")));
            e.target.setAttribute("class","selected");
        }
    });
    
    //Settings
    function toggleElement(element, value){
        var res = element.querySelectorAll("input, button, textarea");
        for(var i=0,l=res.length;i<l;i++){
            if(value)
                res[i].setAttribute("disabled","disabled");
            else
                res[i].removeAttribute("disabled");
        }
    }
    function toggleSettings(useLocal){
        toggleElement(elms.settingsForLocal, !useLocal);
        toggleElement(elms.settingsForExternal, useLocal);
        elms.proxyTypeLocal.checked=useLocal;
        elms.proxyTypeExternal.checked=!useLocal;
        settings.set("useLocal", useLocal);
        updateProxy();
    }
    
    toggleSettings(settings.get("useLocal", true));
    
    elms.proxyTypeLocal.addEventListener("click", function(){
        if(elms.proxyTypeLocal.checked)
            toggleSettings(true);
    });
    elms.proxyTypeExternal.addEventListener("click", function(){
        if(elms.proxyTypeExternal.checked)
            toggleSettings(false);
    });
    
    elms.settingTorPortLocal.value = settings.get("lport", 9050);
    elms.settingTorPortLocal.addEventListener("input", function(){
        settings.set("lport", elms.settingTorPortLocal.value);
        updateProxy();
    });
    
    elms.settingTorHostExternal.value = settings.get("ehost", "");
    elms.settingTorHostExternal.addEventListener("input", function(){
        settings.set("ehost", elms.settingTorHostExternal.value);
        updateProxy();
    });
    
    elms.settingTorPortExternal.value = settings.get("eport", 9050);
    elms.settingTorPortExternal.addEventListener("input", function(){
        settings.set("eport", elms.settingTorPortExternal.value);
        updateProxy();
    });
    
    elms.settingProxyEnableExit.checked = settings.get("enableExit", false);
    elms.settingProxyEnableExit.addEventListener("click", function(e){
        settings.set("enableExit", e.target.checked);
        updateProxy();
    });
    
    elms.testConnection.addEventListener("click", function(){
        chrome.windows.create({
            'url': 'http://hyenastcnv52e7lv.onion/dotoniontest.htm',
            'type': 'popup'
        }, function(window){});
    });
    
    (function(){
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function(){
            elms.ipPublic.textContent = xhr.response;
        });
        xhr.open("GET", "https://api.softhyena.com/whatsmyip.py", true);
        xhr.send();
    })();
    (function(){
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function(){
            elms.ipTor.textContent = xhr.response;
        });
        xhr.open("GET", "http://hyenastcnv52e7lv.onion/tor_ip", true);
        xhr.send();
    })();
    //Initialize i18n
    i18nProcessor(function(k){
        return chrome.i18n.getMessage(k);
    });
});

