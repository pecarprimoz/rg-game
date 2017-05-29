/**
 * Created by neon on 10/24/2016.
 * Projekt sta izdelala: Primož Pečar in Vid Babič.
 *
 * Posebna zahvala Domnu Rostoharju !
 *
 * Final version done on 28/12/2016
 **/

//Definicija barv
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0
};

//Listener s katerim naložimo glavno funkcijo (init)
window.addEventListener('load',init,false);

var onRenderFcts= [];

//Delto potrebujemo za day/night, vrne sys time
var delta=new THREE.Clock();

//Variable za keyboard evente, mappam w s a d space za tipke.
var keyBoardSpecial = new THREEx.KeyboardState();


var scene,
    camera,
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    ,HEIGHT,
    WIDTH,
    renderer,
    container,
    hp,
    coin;

function init(){
    //Nastavi text za hp in coins
    setHudParams();
    //Naredi sceno, velikost ekrane, pozicija kamere, fog etc.
    createScene();
    //Sestavi ladjo in jo doda v sceno
    createBoat();
    //Naredi morje in valove, doda v sceno
    createSea();
    //Naredi skybox, oblake in doda v sceno
    createSky();
    //Dodamo rdečo sfero ki lovi playerja
    addEnemy();
    //Naredimo luči
    createLights();
    //Dodamo day/night cycle
    dayNight();
    //Nastavimo zvok
    setAudio();
    //Loopamo vse metode
    loop();
}

function dayNight(){
    //Pod katerim kotom se premika sonce
    var sunAngle = -Math.PI/2;

    //Pozicija pod katerem pada luč, se spreminja z delto
    onRenderFcts.push(function(delta, now){
        shadowLight.position.set(150,350*Math.sin(sunAngle),350*-Math.sin(sunAngle));
        var dayDuration	= 5000; // nb seconds for a full day cycle
        sunAngle+= Math.PI*2/dayDuration;
    });

    //Dodajanje/posodabljanje noči in skydome-a
    var starField	= new THREEx.DayNight.StarField();
    scene.add(starField.object3d);
    onRenderFcts.push(function(delta, now){
        //console.log(deltaSun)
        starField.update(sunAngle)
    });

    //Dodajanje/posodabljanje sonca
    var sunSphere	= new THREEx.DayNight.SunSphere();
    scene.add( sunSphere.object3d );
    onRenderFcts.push(function(delta, now){
        sunSphere.update(sunAngle)
    });

    //Dodajanje/posodabljanje sončnih žarkov
    var sunLight	= new THREEx.DayNight.SunLight();
    scene.add( sunLight.object3d );
    onRenderFcts.push(function(delta, now){
        sunLight.update(sunAngle)
    });


    //Dodajanje/posodabljanje skydoma podnevi
    var skydom	= new THREEx.DayNight.Skydom();
    scene.add( skydom.object3d );
    onRenderFcts.push(function(delta, now){
        skydom.update(sunAngle)
    })
}

//Glavna funkcija za izdelavo scene
function createScene(){

    //Dobimo notranjo višino in dolžino okna
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    //Naredimo novo sceno
    scene = new THREE.Scene();

    //Dodamo meglo            hex barva,near,far
    scene.fog = new THREE.Fog(0xf7d9aa, 1, 1000);

    //Naredimo kamero, nastavimo aspect ratio, FOV, near in far plane scene
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;

    //Naredimo perspektivno kamero, ta nam služi kot začetna kamera, kasneje jo povozim
    camera =  new THREE.PerspectiveCamera(
                fieldOfView,
                aspectRatio,
                nearPlane,
                farPlane
    );

    //Naredimo rendereder za WebGL, za enkrat uporabljam low poly grafiko
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        precision: "lowp",
        //Uporabimo low poly 'grafiko'
        antialias: true
    });

    //Definiramo velikost rendererja, ta je enak višini in širini okna
    renderer.setSize(WIDTH,HEIGHT);

    //Omogočimo rendering senc
    renderer.shadowMap.enabled = true;

    //Pokličemo div z id-jem world, njemu dodamo renderer
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    //Orbital kontrole, kamera se premika z ladjo
    newCont = new THREE.OrbitControls(camera,renderer.domElement);

    //V primeru če se okno re-siza imamo funkcijo ki to handla, ta event listener jo sproži
    window.addEventListener('resize', handleWindowResize,false);
}

function handleWindowResize() {
    //V primeru da uporabnik spreminja dimenzije okna, se parametri spreminjajo
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}
//Naredimo dve spremenljivke, katere nam hranijo luči, ena je "sonce" durga je za sence
var shadowLight, supportLight;

function createLights() {
    //Dve luči, ena omogoča da ni noč čisto črna, druga je za sence, usmerjene v planet
    shadowLight = new THREE.DirectionalLight(0xffffff, .1);
    supportLight = new THREE.DirectionalLight(0xffffff,.1);

    //Pozicija luči v svetu
    supportLight.position.set(150,350,350);

    //Omogočimo da casta sence
    shadowLight.castShadow = true;

    //Nastavimo pozicijo luči za sence, posledično kje bodo sence izrisane
    shadowLight.shadow.camera.left = -800;
    shadowLight.shadow.camera.right = 700;
    shadowLight.shadow.camera.top = 700;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 10000;

    //Definiramo resolucijo senc, večja vrednost slabši preformance
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //Glavna luč
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .1);

    //Nastavimo pozicijo luči
    shadowLight.position.set(150, 350, 350);

    //Dovolimo da oddaja sence
    shadowLight.castShadow = true;

    //Definiramo polje, ker se sence vidijo
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    //Definiramo resolucijo senc, večja je slabši je preformance
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //Dodamo luči v sceno
    scene.add(hemisphereLight);
    scene.add(shadowLight);
    scene.add(supportLight);
}

//Spremenljivka za denar
var counterMoney=0;

//Array, ki vsebuje hitboxe za 'denar', rabimo zaradi raycastinga in collision detectiona med ladjo in denarjem
var moneyHolder=[];

//Funkcija za izris cilindra, ta bo postal morje
Sea = function () {
    //Naredimo telo v obliki cilindra
    ///CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
    var geom = new THREE.CylinderGeometry(600,600,800,40,10);

    //Izvedemo rotacijo sveta, da smo pozicionirani nekje na sredi morja
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

    //Združi od cilindra točke
    geom.mergeVertices();

    //Vzamemo dolžino arraya ki nam hrani vse točke(njihove koordinate)
    var l = geom.vertices.length;

    //Naredimo array, v katerega bomo shranili dejanske posodobljene točke, posledično valove
    this.waves = [];

    for (var i=0; i<l; i++){
        //Vsaka točka posebaj
        var v = geom.vertices[i];

        //Vzamemo njene vrednosti
        this.waves.push({y:v.y,
            x:v.x,
            z:v.z,
            //Dodamo random kot
            ang:Math.random()*Math.PI*2,
            //Dodamo random razdaljo
            amp: Math.random()*15,
            //Dodamo random hitrost 0.016 in 0.048 radians / frame
            speed:0.0005 + Math.random()*0.004
        });

        //Funkcija ki je zadolžena za spreminjanje vseh točk
        Sea.prototype.moveWaves = function (){

            //Potrebujem za hitboxe, zapomnim si njihove trenutne točke, -600 zaradi pozicije morja
            for( var i = 0 ; i < moneyHolder.length ; i++ ){
                moneyHolder[i].position.y = moneyHolder[i].savedSeaVertice.y-600;
                moneyHolder[i].parentObject.position.y = moneyHolder[i].position.y;
            }

            //Od mesha poberemo vse točke
            var verts = this.mesh.geometry.vertices;
            var l = verts.length;

            for (var i=0; i<l; i++){
                var v = verts[i];

                //Poberemo info. o točkah in novih parametrih
                var vprops = this.waves[i];

                //Posodobimo pozicijo točk, glede na nove parametre
                v.x = vprops.x + Math.cos(vprops.ang)*vprops.amp;
                v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
                counterMoney++;

                //Izris denarja
                /*
                  Izris denarja je realiziran na podlagi točk samih valovov, naredimo nov Cone na poziciji točke morja,
                  tem potem naključno spremenimo vrednost z, kar pomeni da bodo razporejeni levo in desno po morju.
                 */
                if(counterMoney<250){
                    //Naredimo cone
                    var geometry = new THREE.ConeGeometry( 5, 20, 32 );
                    var material = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('../images/cone.jpg') } );
                    var cone = new THREE.Mesh( geometry, material );

                    //Posodobimo njegovo pozicijo
                    cone.position.z = -350+Math.random()*800;
                    cone.position.x=v.x+10;
                    cone.position.y=v.y-600;

                    //Naredimo hitbox za cone
                    var Cubegeometry = new THREE.BoxGeometry( 15, 20, 10 );
                    var Cubematerial = new THREE.MeshBasicMaterial( {color: 0x00ffff, transparent: true,opacity: 0} );
                    var coneHitBox = new THREE.Mesh( Cubegeometry, Cubematerial );

                    //Posodobimo pozicijo hitboxa na pozicijo cone-a
                    coneHitBox.position.x=cone.position.x;
                    coneHitBox.position.y=cone.position.y+0.5;
                    coneHitBox.position.z=cone.position.z;

                    //Shranimo objekt v array, kasneje uporabljen v collision detectionu
                    moneyHolder.push(coneHitBox);

                    /*
                      V hitbox si shranim tudi vrednosti samega verticija, rabim za posodabljanje lokacije, ni popolno
                      vendar sedaj saj niso pod morjem.
                    */
                    coneHitBox.parentObject = cone;
                    coneHitBox.savedSeaVertice = v;

                    //Dodamo hitbox in cone v sceno.
                    scene.add(coneHitBox);
                    scene.add( cone );
                }
                //Povečamo kot za nasleden frame
                vprops.ang += vprops.speed;
            }
            //Povemo rendererju da mora posodobiti točke
            this.mesh.geometry.verticesNeedUpdate=true;
            //S tem reguliramo hitrost posodabljanja morja
            sea.mesh.rotation.z += .00002;
        }
    }

    //Naredimo material za morje
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.blue,
        transparent:true,
        opacity:1,
        shading:THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom,mat);
    //Dovolmo da bo morje prejemalo sence
    this.mesh.receiveShadow = true;

};

//Naredimo sprejemljivko ki nam bo držala morje (torej material + mesh)
var sea;

function createSea(){
    //Pokličemo zgornjo funkcijo ki nam vse naloži
    sea = new Sea();

    //Postavimo na spodni del scene
    sea.mesh.position.y = -600;

    //Dodamo mesh morja v sceno
    scene.add(sea.mesh);
}


//Funkcija za izdelavo oblakov
Cloud = function () {
    //Naredimo container ki bo držal oblak
    this.mesh = new THREE.Object3D();

    //Naredimo geomerijo za kvader
    //Večkat ga bomo uporabil da nardimo oblak
    var geom = new THREE.BoxGeometry(20,20,20);

    //Naredimo material za oblak
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.white
    });

    //Večkat dupliciramo da nardimo oblak
    var nBlocs = 3+Math.floor(Math.random()*4);
    for(var i=0; i<nBlocs; i++){
        //Naredimo več istih geomerij
        var m = new THREE.Mesh(geom,mat);

        //Njihove pozicije naključno posodobimo
        m.position.x=i*15;
        m.position.y = Math.random()*10;
        m.position.z = Math.random()*10;
        m.rotation.z = Math.random()*Math.PI*2;
        m.rotation.y = Math.random()*Math.PI*2;

        //Jih naključno skaliramo
        var s = .1 + Math.random()*.9;
        m.scale.set(s,s,s);

        //Dovolimo da dobi sence in da jih oddaja
        m.castShadow = true;
        m.receiveShadow = true;

        //Dodamo v zgornji kontejner
        this.mesh.add(m);
    }
};

//Naredimo celotno nebo
Sky = function(){
    this.mesh = new THREE.Object3D();

    //S tem reguliramo št. oblakov
    this.nClouds= 65;

    //Razporejamo okoli sveta, torej Math.PI*2(enako kot za svet)
    var stepAngle = Math.PI*2 / this.nClouds;

    //Nardimo oblake
    for(var i=0; i<this.nClouds; i++){
        var c = new Cloud();
        var a = stepAngle*i; //Končen kot oblaka
        var h = 750 + Math.random()*200; //Razdalja med centrom+ naključna razdalja da bo nekje v zraku

        //Polarne koordinate spreminjamo v take ki jih lahko uporabimo
        c.mesh.position.y = Math.sin(a)*h+10;
        c.mesh.position.x = Math.cos(a)*h;

        //Obrnemo oblak glede na pozicijo
        c.mesh.rotation.z = a + Math.PI/2;

        //Pozicioniramo na različnih globinah
        c.mesh.position.z = -350+Math.random()*800;
        //Še različna velikost za posamezen oblak
        var s = 1+Math.random()*2;
        c.mesh.scale.set(s,s,s);

        //Dodamo mesh v kontejner
        this.mesh.add(c.mesh);
    }
};

//Naredimo nebo
var sky;
function createSky(){
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

//Funkcija ki služi sledenju ladici
function updateFollowCamera(){
    //Pozicijo kamere nastavimo na pozicijo ladje
    camera.position.x = boat.mesh.position.x;
    camera.position.z = boat.mesh.position.z;
    camera.position.y = boat.mesh.position.y;

    //Kamero dvignemo v zrak in porinemo nazaj
    camera.position.y +=50;
    camera.position.x -= 175;

    //Definiramo up vector, torej kaj bo up za kamero
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(boat.mesh.position);
}

//Spremenljivka, da vemo kdaj smo na tleh
var onGround = true;

//Funkcija za poslušanje tipkovnice in interakcijo z ladjico
function updateFollowControls(){
    //Dobimo za koliko se naj rotiramo, A, D
    var rotateAngle = Math.PI / 2 * delta.getDelta();
    //Za koliko se premikamo
    var moveDistance = 300 * delta.getDelta();
    //Hitrost premikanja
    var boatSPEED=0.5;

    //V primeru da imamo nad 6/9 kovancov posodobimo hitrost ladje
    if (parseInt(coin.textContent)>=6){
        boatSPEED=0.65
    }
    if (parseInt(coin.textContent)>=9){
        boatSPEED=0.8
    }

    //V primeru da še imamo življenja, poslušamo tipkovico
    if(parseInt(hp.textContent)>0 && parseInt(coin.textContent)<10){
        //Premik naprej
        if ( keyBoardSpecial.pressed("W")){
            boat.mesh.translateX( moveDistance+boatSPEED);
        }

        //Premik nazaj
        if ( keyBoardSpecial.pressed("S")){
            boat.mesh.translateX( -moveDistance-boatSPEED);
        }

        //Rotacija v levo
        if ( keyBoardSpecial.pressed("A")){
            boat.mesh.rotateOnAxis(new THREE.Vector3(0,1,0), rotateAngle);
        }
        //Rotacija v desno
        if ( keyBoardSpecial.pressed("D")){
            boat.mesh.rotateOnAxis(new THREE.Vector3(0,1,0), -rotateAngle);
        }
        //Skok ladje
        if ( keyBoardSpecial.pressed("space")){
            if(onGround){
                playSound("jump");
                onGround=false;
            }
        }
        //Trobljenje
        if ( keyBoardSpecial.pressed("H")){
            playSound("honk");
        }
    }
}


var listener;
var sound1;
var sound2;
var sound3;
var audioLoader;

//Nastavimo parametre za zvok in predvajamo ambientno glasbo
function setAudio(){
listener = new THREE.AudioListener();
camera.add( listener );
sound1 = new THREE.Audio( listener );
sound2 = new THREE.Audio( listener );
sound3 = new THREE.Audio( listener );
audioLoader = new THREE.AudioLoader();

//Naloži glasbo in jo predvaja
audioLoader.load( '../sounds/ambient.mp3', function( buffer ) {
    sound1.setBuffer( buffer );
    sound1.setLoop(true);
    sound1.setVolume(0.3);
    sound1.play();
});

audioLoader.load( '../sounds/boat.mp3', function( buffer ) {
    sound2.setBuffer( buffer );
    sound2.setLoop(true);
    sound2.setVolume(0.3);
    sound2.play();
});

audioLoader.load( '../sounds/music.mp3', function( buffer ) {
    sound3.setBuffer( buffer );
    sound3.setLoop(true);
    sound3.setVolume(0.3);
    sound3.play();
});
}

//Zvok različnih akcij
function playSound(action) {
    var sound = new THREE.Audio( listener );
    var path = "../sounds/"+action+".mp3";
    audioLoader.load(path, function(buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        sound.play();
    })
}

//Tukaj kličemo funkcije, ki se morajo posodabljati na frame
var jumpHitrost=0.5;
function loop(){
    /*default vals
     sea.mesh.rotation.z += .003;
     sky.mesh.rotation.z += .01;
     */

    //Posodobimo ladjo na vodno gladino, da sledi valovom in ne potone
    updateBoat();

    //premikamo valove morja
    sea.moveWaves();

    //Posodobimo sovražnika/premikanje tega
    updateEnemy();

    //Preverjamo ali smo na tleh, na tleh ne bomo ko player pritisne space, takrat ladja skoči.
    if(!onGround){
        //Ugasnimo raycasting, čene ladjo takoj zalima na morje
        rayCast=false;
        //Povečujemo y pozicijo ladje
        boat.mesh.position.y+=jumpHitrost;

        //Preverjamo ali je naša ladja na y koordinati ki jo zazna raycaster, v primeru da ni manjšamo y (padamo dol)
        if(boat.mesh.position.y<=myIntersect){
            //Še zadnjič zmajšamo pozicijo y, vklopimo nazaj raycaster, povemo igri da smo na tleh
            boat.mesh.position.y-=jumpHitrost;
            rayCast=true;
            onGround=true;
            //Ponastavimo hitrost skoka
            jumpHitrost=0.5
        }
        jumpHitrost-=0.01

    }

    //Rotiramo svet in nebo
    sea.mesh.rotation.z += .0003;
    sky.mesh.rotation.z += .0005;

    //Posodabljamo follow camero
    updateFollowCamera();

    //Posodabljamo follow kontrole
    updateFollowControls();

    //Če zgubim/zmagam delaj neumne stvari
    if(parseInt(hp.textContent)===0 || parseInt(coin.textContent)===10){
        sea.mesh.rotation.z += .02;
        sky.mesh.rotation.z += .03;
        boat.mesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/15);
    }



    //Povemo rendereju da mora renderat kamero in sceno
    renderer.render(scene, camera);
    newCont.update();
    requestAnimationFrame(loop);
}

//Po resnici povedano, nisem čisto siguren kaj se tukaj dogaja, posodabljamo day/night na podlagi delta časa,
//in posledično animiramo.
var lastTimeMsec= null;
requestAnimationFrame(function animate(nowMsec){
    // keep looping
    requestAnimationFrame( animate );
    // measure time
    lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
    var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec	= nowMsec;
    // call each update function
    onRenderFcts.forEach(function(onRenderFct){
        onRenderFct(deltaMsec/1000, nowMsec/1000)
    })
});

//Raycast za ladjo
var rayCast=true;

//Hitbox za ladjo
var boatHitBox;

//Prva stvar ki jo zadane raycaster
var myIntersect;

//Funkcija za izdelavo ladje
var boat = function() {

    this.mesh = new THREE.Object3D();
    this.mesh.position.y=1000;

    //Naredimo spodnji del
    var geomBoat = new THREE.BoxGeometry(90,15,70);
    var matBoat = new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture('../images/wood.jpg') });
    var boat = new THREE.Mesh(geomBoat, matBoat);
    boat.castShadow = true;
    boat.receiveShadow = true;
    this.mesh.add(boat);

    //Naredimo štango
    var geomPole = new THREE.BoxGeometry(5,60,5);
    var matPole = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
    var pole = new THREE.Mesh(geomPole,matPole);
    pole.position.x=20;
    pole.position.y=35+boat.position.y;
    pole.castShadow = true;
    pole.receiveShadow = true;
    this.mesh.add(pole);

    //Naredimo krov
    for (var i=0; i<7; i++){
        var geomSail = new THREE.BoxGeometry(5,40-i*5,5);
        var matSail= new THREE.MeshPhongMaterial({map: THREE.ImageUtils.loadTexture('../images/sail.jpg')});
        var sail = new THREE.Mesh(geomSail,matSail);
        sail.position.x=15-i*5;
        sail.position.y=40+boat.position.y;
        sail.castShadow = true;
        sail.receiveShadow = true;
        this.mesh.add(sail);
    }

    //Naredimo hitbox
    var Cubegeometry = new THREE.BoxGeometry( 100, 75, 100 );
    var Cubematerial = new THREE.MeshBasicMaterial( {color: 0x0000ff, transparent: true,opacity: 0} );
    boatHitBox = new THREE.Mesh( Cubegeometry, Cubematerial );
    boatHitBox.position.y = boat.position.y+35;
    this.mesh.add(boatHitBox);

    //Funkcija ki je zadolžena za vse kar je povezano z hitboxi in raycastanjem na ladji
    this.updateRay = function () {
        //Naredimo vektor, ki se nahaja na poziciji celotne ladje
        var originFirst = new THREE.Vector3(this.mesh.position.x,this.mesh.position.y,this.mesh.position.z);

        //Usmerjen bo dol po y koordinati
        var directionFirst = new THREE.Vector3(0,-1,0);

        //Naredimo raycaster, na podlagi prve stvari ki jo zadane.
        var raycasterFirst = new THREE.Raycaster(originFirst,directionFirst);

        //Gledamo katero stvar zadane, na podlagi celotne scene
        var intersectsFirst = raycasterFirst.intersectObjects( scene.children );

        //V primeru da gre ladja čez rob mape, ugasnim raycasting,
        //ko ladja pride čez nek treshold jo postavim na spawn point
        if(this.mesh.position.z>400 || this.mesh.position.z<-400){
            rayCast=false;
            this.mesh.position.y-=5;
            if(this.mesh.position.y<-1000){
                reposition();
            }
        }
        //Pogledam prvo stvar s katero spodnji del zadje zabije, dodam +1 da slučajno ne padem skozi morje
        myIntersect=intersectsFirst[0].point.y+1;
        //V primeru da smo našli stvar s katero smo se zabili in da imamo vklopljen raycasting nastavimo pozicijo ladje
        //na to, kar je zadel raycast
        if(intersectsFirst.length>0 && rayCast){
            this.mesh.position.y=intersectsFirst[0].point.y+1;
        }

        //Računamo razdaljo med najbližjimi cone-i, (radius 20)
        for (var i = 0; i < moneyHolder.length; i++) {
            var distance = Math.sqrt(
                Math.pow(moneyHolder[i].position.x - this.mesh.position.x, 2) +
                Math.pow(moneyHolder[i].position.y - this.mesh.position.y, 2) +
                Math.pow(moneyHolder[i].position.z - this.mesh.position.z, 2));

            //V primeru da najdemo tako distanco moramo reagirati na cone
            if (distance < 20) {
                //Cone zbrišemo iz scene, hitbox je parent od Cone-a, tako oboje zbrišemo iz scene
                scene.remove(moneyHolder[i].parentObject);

                //Posodobimo HUD, en Cone več
                coin.innerHTML=parseInt(coin.textContent)+1;

                //Predvajamo zvok
                playSound("coin");

                //Ko naberemo dovolj kovancev se igra konča
                if (coin.textContent == 15) {
                    //Predvajamo zvok
                    playSound("gamewin");
                    //Gremo v funkcijo za konec igre
                    endGameWin();
                }

                //Zbrišemo še hitbox
                scene.remove(moneyHolder[i]);

                //Iz arraya odstranimo Cone
                moneyHolder.splice(i,1)
            }
        }

        //Enako stvar delamo za enemija, v primeri da je v razdalji 25
        var distance = Math.sqrt(
            Math.pow(enemy.mesh.position.x - this.mesh.position.x, 2) +
            Math.pow(enemy.mesh.position.y - this.mesh.position.y, 2) +
            Math.pow(enemy.mesh.position.z - this.mesh.position.z, 2));
        if (distance < 25) {
            reposition()
        }
    }
};

//Naredimo novo ladjo, jo skaliramo in dodamo v sceno
var boat  = new boat();
function createBoat(){
    boat.mesh.scale.set(.25,.25,.25);
    scene.add(boat.mesh);
}

//Funkcija ki posodablja ladjo glede na frame, če nimamo življenj nehamo z raycastingom
function updateBoat(){
    if(parseInt(hp.textContent)>0 && parseInt(coin.textContent)<10)
        boat.updateRay();
}

//Funkcija ki postavi ladjo nazaj na spawn point
function reposition() {
    boat.mesh.position.x = 0;
    boat.mesh.position.y = 10;
    boat.mesh.position.z = 0;

    //Enemy tudi postavimo na začetno lokacijo
    enemy.mesh.position.y = 75;
    enemy.mesh.position.x = 80;

    //Zmanjšamo hp na HUD-u
    hp.innerHTML = hp.textContent - 1;

    //Predvajamo zvok
    playSound("hit");

    //V primeru da nimamo življeni, ustavimo igro
    if (hp.textContent == 0) {
        //Predvajamo zvok
        playSound("gameover");
        //Gremo v funkcijo za konec igre
        endGameLose();
    }
}

//Natavitev parametrov HUD-a
function setHudParams(){
    hp = document.getElementById("hp");
    coin = document.getElementById("coin");
    hp.innerHTML=3;
    coin.innerHTML=0;
}

//Funkciji ki se prožita ob koncu igre
function endGameLose(){
    var end = document.getElementById("end");
    end.innerHTML="YOU LOST"
}

function endGameWin(){
    document.getElementById("end").style.color = "lawngreen";
    var end = document.getElementById("end");
    end.innerHTML="YOU WIN"
}

//Definicija enemija
var pointVec;
var sphere = function(){
    this.mesh = new THREE.Object3D();

    //Začetna hitrost s katero se premika enemy
    var SPEED=0.3;

    //Kreiramo enemija, ga dodamo vsceno
    var geometry = new THREE.SphereGeometry( 15, 32, 32 );
    var material = new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture('../images/enemy.jpg') } );
    var sphere = new THREE.Mesh( geometry, material );
    this.mesh.add(sphere);
    this.mesh.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI);

    //Naredimo hitbox za enemija, rabimo pri collision detectionu med ladjo in enemijem
    var Cubegeometry = new THREE.BoxGeometry( 30, 30, 30 );
    var Cubematerial = new THREE.MeshBasicMaterial( {color: 0xfffff, transparent: true,opacity: 0} );
    enemyHitBox = new THREE.Mesh( Cubegeometry, Cubematerial );
    enemyHitBox.position = sphere.position;
    this.mesh.add(enemyHitBox);

    //Funkcija ki je zadolžena da enemy sledi ladjici
    this.chasePlayer = function () {

        //V primeru, da igralec nima več življenja ustavimo enemija
        if(parseInt(hp.textContent)===0 || parseInt(coin.textContent)===10){
            SPEED=0;
        }

        //V primeru da ima igralec 3/6/9 kovancev večamo hitrost enemija
        if(parseInt(coin.textContent)===3){
            SPEED=0.4
        }

        else if(parseInt(coin.textContent)===6){
            SPEED=0.5
        }

        else if(parseInt(coin.textContent)===9){
            SPEED=0.6
        }

        //Point vector, usmerimo enemija v ladjo, da ve kam mora gledat in se premikati
        pointVec = boat.mesh.position.clone().sub(enemy.mesh.position).normalize().multiplyScalar(SPEED);
        enemy.mesh.position=enemy.mesh.position.add(pointVec);
    }
};

//Naredimo novega sovražnika, mu nastavimo pozicijo in ga dodamo v sceno
var enemy = new sphere();
function addEnemy(){
    enemy.mesh.position.y=75;
    enemy.mesh.position.x=80;
    scene.add(enemy.mesh);
}

//Posodabljamo lokacijo enemija
function updateEnemy(){
    enemy.chasePlayer();
}