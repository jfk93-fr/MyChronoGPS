var pitDef = false; // indicateur pitlane définie oui/non
var inPit = false; // indicateur dans pitlane oui/non
var pitcap = 0; // cap de la pitlane

function showLines() {
	var isObjLine = false;
	if (thisCircuit.LatFL && thisCircuit.LonFL) {
		objStart.lat = thisCircuit.LatFL*1;
		objStart.lon = thisCircuit.LonFL*1;
		objStart.cap = thisCircuit.CapFL*1;
		if (isNaN(objStart.cap))
			objStart.cap = 0;
		isObjLine = true;
	}
	if (thisCircuit.FL) {
		objStart.coord = new Array(thisCircuit.FL[0]*1,thisCircuit.FL[1]*1,thisCircuit.FL[2]*1,thisCircuit.FL[3]*1);
		isObjLine = true;
	}
	if (isObjLine) {
		if (typeof thisCircuit.NameFL != "undefined") {
			objStart.title = thisCircuit.NameFL;
		}
		else {
			objStart.title = "Ligne de départ/arrivée";
		}
		objStart.color = "black";
		objStart.idelem = "FL";

		drawLine(objStart);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatInt1 && thisCircuit.LonInt1) {
		Tabint[0] = new Object();
		Tabint[0].lat = thisCircuit.LatInt1*1;
		Tabint[0].lon = thisCircuit.LonInt1*1;
		Tabint[0].cap = thisCircuit.CapInt1*1;
		if (isNaN(Tabint[0].cap))
			Tabint[0].cap = 0;
		isObjLine = true;
	}
	if (thisCircuit.Int1) {
		Tabint[0] = new Object();
		Tabint[0].coord = new Array(thisCircuit.Int1[0]*1,thisCircuit.Int1[1]*1,thisCircuit.Int1[2]*1,thisCircuit.Int1[3]*1);
		isObjLine = true;
	}
	if (isObjLine) {
		if (typeof thisCircuit.NameInt1 != "undefined") {
			Tabint[0].title = thisCircuit.NameInt1;
		}
		else {
			Tabint[0].title = "Intermédiaire 1";
		}
		Tabint[0].color = "yellow";
		Tabint[0].idelem = "Int1";

		drawLine(Tabint[0]);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatInt2 && thisCircuit.LonInt2) {
		Tabint[1] = new Object();
		Tabint[1].lat = thisCircuit.LatInt2*1;
		Tabint[1].lon = thisCircuit.LonInt2*1;
		Tabint[1].cap = thisCircuit.CapInt2*1;
		if (isNaN(Tabint[1].cap))
			Tabint[1].cap = 0;
		isObjLine = true;
	}
	if (thisCircuit.Int2) {
		Tabint[1] = new Object();
		Tabint[1].coord = new Array(thisCircuit.Int2[0]*1,thisCircuit.Int2[1]*1,thisCircuit.Int2[2]*1,thisCircuit.Int2[3]*1);
		isObjLine = true;
	}
	if (isObjLine) {
		if (typeof thisCircuit.NameInt2 != "undefined") {
			Tabint[1].title = thisCircuit.NameInt2;
		}
		else {
			Tabint[1].title = "Intermédiaire 2";
		}
		Tabint[1].color = "yellow";
		Tabint[1].idelem = "Int1";

		drawLine(Tabint[1]);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatInt3 && thisCircuit.LonInt3) {
		Tabint[2] = new Object();
		Tabint[2].lat = thisCircuit.LatInt3*1;
		Tabint[2].lon = thisCircuit.LonInt3*1;
		Tabint[2].cap = thisCircuit.CapInt3*1;
		if (isNaN(Tabint[2].cap))
			Tabint[2].cap = 0;
		isObjLine = true;
	}
	if (thisCircuit.Int3) {
		Tabint[2] = new Object();
		Tabint[2].coord = new Array(thisCircuit.Int3[0]*1,thisCircuit.Int3[1]*1,thisCircuit.Int3[2]*1,thisCircuit.Int3[3]*1);
		isObjLine = true;
	}
	if (isObjLine) {
		if (typeof thisCircuit.NameInt3 != "undefined") {
			Tabint[2].title = thisCircuit.NameInt3;
		}
		else {
			Tabint[2].title = "Intermédiaire 3";
		}
		Tabint[2].color = "yellow";
		Tabint[2].idelem = "Int3";

		drawLine(Tabint[2]);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatPitIn && thisCircuit.LonPitIn) {
		objPitIn = new Object();
		objPitIn.lat = thisCircuit.LatPitIn*1;
		objPitIn.lon = thisCircuit.LonPitIn*1;
		objPitIn.cap = thisCircuit.CapPitIn*1;
		if (isNaN(objPitIn.cap))
			objPitIn.cap = 0;
		objPitIn.title = "entrée Pitlane";
		objPitIn.color = "red";
		objPitIn.idelem = "PitIn";
		isObjLine = true;
	}
	if (thisCircuit.PitIn) {
		objPitIn = new Object();
		objPitIn.coord = new Array(thisCircuit.PitIn[0]*1,thisCircuit.PitIn[1]*1,thisCircuit.PitIn[2]*1,thisCircuit.PitIn[3]*1);
		objPitIn.cap = 0;
		objPitIn.title = "entrée Pitlane";
		objPitIn.color = "red";
		objPitIn.idelem = "PitIn";
		isObjLine = true;
	}
	if (isObjLine) {
		drawLine(objPitIn);
	}
	
	var isObjLine = false;
	if (thisCircuit.LatPitOut && thisCircuit.LonPitOut) {
		objPitOut = new Object();
		objPitOut.lat = thisCircuit.LatPitOut*1;
		objPitOut.lon = thisCircuit.LonPitOut*1;
		objPitOut.cap = thisCircuit.CapPitOut*1;
		if (isNaN(objPitOut.cap))
			objPitOut.cap = 0;
		objPitOut.title = "sortie Pitlane";
		objPitOut.color = "green";
		objPitOut.idelem = "PitOut";
		isObjLine = true;
	}
	if (thisCircuit.PitOut) {
		objPitOut = new Object();
		objPitOut.coord = new Array(thisCircuit.PitOut[0]*1,thisCircuit.PitOut[1]*1,thisCircuit.PitOut[2]*1,thisCircuit.PitOut[3]*1);
		objPitOut.cap = 0;
		objPitOut.title = "sortie Pitlane";
		objPitOut.color = "green";
		objPitOut.idelem = "PitOut";
		isObjLine = true;
	}
	if (isObjLine) {
		drawLine(objPitOut);
	}
	// calcul du cap entre pitIn et pitOut
	if (objPitIn.hasOwnProperty('coord') && objPitOut.hasOwnProperty('coord'))
		pitDef = true;

	if (pitDef) {
		// si les caps pitIn et pitOut sont définis, on calcul un cap moyen
		if (objPitIn && objPitOut) {
			if (objPitIn.cap > 0 && objPitOut.cap > 0) {
				pitcap = (objPitIn.cap + objPitOut.cap) / 2;
			}
		}
		if (pitcap == 0) {
			//le cap n'est pas connu, on calcule le milieu de chaque ligne
			var midIn = false;
			var midOut = false;
			if (objPitIn) {
				midIn = new Object();
				if (objPitIn.cap == 0) {//jfk
					midIn.lat = (objPitIn.coord[0]+objPitIn.coord[2])/2;
					midIn.lng = (objPitIn.coord[1]+objPitIn.coord[3])/2;
				}
				else {
					midIn.lat = objPitIn.lat;
					midIn.lng = objPitIn.lon;
				}
			}
			if (objPitOut) {
				midOut = new Object();
				if (objPitOut.cap == 0) {
					midOut.lat = (objPitOut.coord[0]+objPitOut.coord[2])/2;
					midOut.lng = (objPitOut.coord[1]+objPitOut.coord[3])/2;
				}
				else {
					midOut.lat = objPitOut.lat;
					midOut.lng = objPitOut.lon;
				}
			}
			// si les 2 milieux sont définis, le cap correspond à la ligne passant par les 2 milieux
			if (midIn && midOut) {
				pitcap = computeHeading(midIn, midOut);
			}
		}
	}
}

function computeHeading(from, to) {
    var fromLat = deg2rad(from.lat);
    var toLat = deg2rad(to.lat);
    var deltaLng = deg2rad(to.lng) - deg2rad(from.lng);

    var angle = rad2deg(
        Math.atan2(
            Math.sin(deltaLng) * Math.cos(toLat),
            Math.cos(fromLat) * Math.sin(toLat) -
                Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)
        )
    );

    return fmod(angle, -180, 180);
}

function fmod(angle, start, end) {
    end -= start;
    return ((((angle - start) % end) + end) % end) + start;
}


function isLineCut(SegAB, SegCD) {
	var intersec = getIntersection(SegAB,SegCD)
	if (intersec != false)
		intersec = true;
	return intersec;
}

function getDestination(ilat,ilon, cap, distance, radius=6371e3) {
    const φ1 = deg2rad(ilat), λ1 = deg2rad(ilon);
    const θ = deg2rad(cap);

    const δ = distance / radius; // angular distance in radians

    const Δφ = δ * Math.cos(θ);
    let φ2 = φ1 + Δφ;

    // check for some daft bugger going past the pole, normalise latitude if so
    if (Math.abs(φ2) > π / 2) φ2 = φ2 > 0 ? π - φ2 : -π - φ2;

    const Δψ = Math.log(Math.tan(φ2 / 2 + π / 4) / Math.tan(φ1 / 2 + π / 4));
    const q = Math.abs(Δψ) > 10e-12 ? Δφ / Δψ : Math.cos(φ1); // E-W course becomes ill-conditioned with 0/0

    const Δλ = δ * Math.sin(θ) / q;
    const λ2 = λ1 + Δλ;

    const lat = rad2deg(φ2);
    const lon = rad2deg(λ2);

    return new Array(lat, lon);
}

function getDistanceLine(A,B) {
	// calcul des longueurs des côtés du triangle formé par la position courante et les 2 points situés de part et d'autre de la ligne
	var dAB = distanceGPS(new Array(A[0],A[1]),new Array(A[2],A[3]));
	var dAC = distanceGPS(new Array(A[0],A[1]),B);
	var dBC = distanceGPS(new Array(A[2],A[3]),B);
	//On place les 3 points sur un plan tel que A est l'origine (x=0;y=0) et B (x=dAB;0)
	// calcul de cos A
	var a = dBC;
	var b = dAC;
	var c = dAB;
	
	var a2 = a*a;
	var b2 = b*b;
	var c2 = c*c;
	
	var cosA = ((a2*-1)+b2+c2)/(2*b*c);
	var arcosA = Math.acos(cosA);
	if (Number.isNaN(arcosA))
		arcosA = 0;
	var angle = rad2deg(arcosA);
	var sinA = Math.sin(arcosA);
	var dD = sinA*dAC; // distance entre le point C et la droite AB
	return dD;
}

function distanceGPS(A, B) {
	var latA = deg2rad(A[0]);
	var lonA = deg2rad(A[1]);
	var latB = deg2rad(B[0]);
	var lonB = deg2rad(B[1]);
	/*
	 **
     * Returns the distance along the surface of the earth from ‘this’ point to destination point.
     *
     * Uses haversine formula: a = sin²(Δφ/2) + cosφ1·cosφ2 · sin²(Δλ/2); d = 2 · atan2(√a, √(a-1)).
     *

        // a = sin²(Δφ/2) + cos(φ1)⋅cos(φ2)⋅sin²(Δλ/2)
        // δ = 2·atan2(√(a), √(1−a))
        // see mathforum.org/library/drmath/view/51879.html for derivation
		
Presuming a spherical Earth with radius R (see below), and that the
locations of the two points in spherical coordinates (longitude and
latitude) are lon1,lat1 and lon2,lat2, then the Haversine Formula 
(from R. W. Sinnott, "Virtues of the Haversine," Sky and Telescope, 
vol. 68, no. 2, 1984, p. 159): 

  dlon = lon2 - lon1
  dlat = lat2 - lat1
  a = (sin(dlat/2))^2 + cos(lat1) * cos(lat2) * (sin(dlon/2))^2
  c = 2 * atan2(sqrt(a), sqrt(1-a)) 
  d = R * c		

Number.prototype.toRadians = function() { return this * π / 180; };
Number.prototype.toDegrees = function() { return this * 180 / π; };
*/
	var radius = RT;
	const R = radius;
	const φ1 = latA,  λ1 = lonA;
	const φ2 = latB, λ2 = lonB;
	const Δφ = φ2 - φ1;
	const Δλ = λ2 - λ1;

	const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2) * Math.sin(Δλ/2)*Math.sin(Δλ/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	const d = R * c;

    // angle en radians entre les 2 points
	var MsinlatA = Math.sin(latA);
	var MsinlatB = Math.sin(latB);
	var McoslatA = Math.cos(latA);
	var McoslatB = Math.cos(latB);
	var Mabs = Math.abs(lonB-lonA);
	var Msin = MsinlatA * MsinlatB;
	var Mcoslat = McoslatA * McoslatB;
	var Mcoslon = Math.cos(Mabs);
	var Mcos = Mcoslat*Mcoslon;
	var Acos = Msin + Mcos;
	if (Acos > 1) Acos = 1;
	var D = Math.acos(Acos);
    //var S = Math.acos(Math.sin(latA)*Math.sin(latB) + Math.cos(latA)*Math.cos(latB)*Math.cos(Math.abs(longB-longA)))
	var S = D;
    // distance entre les 2 points, comptée sur un arc de grand cercle
	var distance = S*RT;
    return distance;
}

// placer 2 points sur la droite perpendiculaire à la droite A,B passant par A, situées de part et d'autre de A à une distance de A égale à la distance A-B
function getPerpendiculaire(A,B) { // coordonnées du point A, point B
	// les coordonnées sont ramenées sur un plan, abscisse x = longitude, coordonnée y = latitude
	var Ya = A[0];
	var Xa = A[1];
	var Yb = B[0];
	var Xb = B[1];
	// le rayon du cerlce de centre A est égal à la distance A,B
	var r = distanceGPS(A,B);
	
	// coordonnées d'un point B sur un cercle de centre A: X, Y
	var X = Xb-Xa; // X = côté Adjacent de l'angle a
	var Y = Yb-Ya; // Y = côté Opposé de l'angle a

	var latA = deg2rad(A[0]);
	var lonA = deg2rad(A[1]);
	var latB = deg2rad(B[0]);
	var lonB = deg2rad(B[1]);
	
	var cosA = Math.cos(latA);
	var cosB = Math.cos(latB);
	
	var PX = Xa+(Y*(1/cosA));
	var PY = Ya+(X*cosA*-1);
	var PXo = Xa-(Y*(1/cosA));
	var PYo = Ya-(X*cosA*-1);
	var newcoord = new Array(PY,PX,PYo,PXo);
	return newcoord;	
}

// placer un point sur la droite A,B à une distance d du point A
function pointDroite(A,B,d) { // coordonnées du point A, point B et distance à partir de A
	var dtot = distanceGPS(A,B)	;
	var latp1 = A[0];
	var lonp1 = A[1];
	var latp2 = B[0];
	var lonp2 = B[1];
	var latc = latp1+((latp2-latp1)*d/dtot);
	var lonc = lonp1+((lonp2-lonp1)*d/dtot);
	return new Array(latc,lonc);	
}

function getIntersection(SegAB,SegCD) {
	var Ax = SegAB[0]*1;
	var Ay = SegAB[1]*1;
	var Bx = SegAB[2]*1;
	var By = SegAB[3]*1;
	
	var Cx = SegCD[0]*1;
	var Cy = SegCD[1]*1;
	var Dx = SegCD[2]*1;
	var Dy = SegCD[3]*1;

	var Sx;
	var Sy;
	
	if(Ax==Bx)
	{
		if(Cx==Dx) return false;
		else
		{
			var pCD = (Cy-Dy)/(Cx-Dx);
			Sx = Ax;
			Sy = pCD*(Ax-Cx)+Cy;
		}
	}
	else
	{
		if(Cx==Dx)
		{
			var pAB = (Ay-By)/(Ax-Bx);
			Sx = Cx;
			Sy = pAB*(Cx-Ax)+Ay;
		}
		else
		{
			var pCD = (Cy-Dy)/(Cx-Dx);
			var pAB = (Ay-By)/(Ax-Bx);
			var oCD = Cy-pCD*Cx;
			var oAB = Ay-pAB*Ax;
			Sx = (oAB-oCD)/(pCD-pAB);
			Sy = pCD*Sx+oCD;
		}
	}
	// limité à 14 chiffres après la virgule
	Sx = precis14(Sx);
	Ax = precis14(Ax);
	Bx = precis14(Bx);
	Cx = precis14(Cx);
	Dx = precis14(Dx);
	Sy = precis14(Sy);
	Ay = precis14(Ay);
	By = precis14(By);
	Cy = precis14(Cy);
	Dy = precis14(Dy);
	if((Sx<Ax && Sx<Bx)|(Sx>Ax && Sx>Bx) | (Sx<Cx && Sx<Dx)|(Sx>Cx && Sx>Dx)
			| (Sy<Ay && Sy<By)|(Sy>Ay && Sy>By) | (Sy<Cy && Sy<Dy)|(Sy>Cy && Sy>Dy)) return false;
	var ret = new Array(Number.parseFloat(Sx),Number.parseFloat(Sy))
	return ret
}
function precis14(x) {
  return Number.parseFloat(x).toFixed(14);
}
/*
*/
function getIntersectionSphere(line1 ,line2) {
   /*
   line consists of two points defined by latitude and longitude :
   line = {
      'lat1' : lat1,
      'long1' : long1,
      'lat2' : lat2,
      'long2' : long2
      }
   in decimal
   */
   // find the plane of the line in cartesian coordinates
   var p1 = findPlane(line1[0],line1[1],line1[2],line1[3]);
   var p2 = findPlane(line2[0],line2[1],line2[2],line2[3])
   // The intersection of two planes contains of course the
   // point of origin, but also the point P : (x,y,z)
   // x = b1 * c2 - c1 * b2
   // y = c1 * a2 - a1 * c2
   // z = a1 * b2 - b1 * a2
   var x = p1['b'] * p2['c'] - p1['c'] * p2['b'];
   var y = p1['c'] * p2['a'] - p1['a'] * p2['c'];
   var z = p1['a'] * p2['b'] - p1['b'] * p2['a'];
   
   var norme = Math.sqrt(x**2+y**2+z**2);
   var lat1 = rad2deg(Math.asin(z/norme));
   var long1 = rad2deg(Math.atan2(y,x));
   lat2 = - (lat1)
   if (long1 <= 0)
      long2 = long1 + 180
   else
      long2 = long1 - 180
   var intersection1 = {'latitude' : lat1, 'longitude' : long1};
   var intersection2 = {'latitude' : lat2, 'longitude' : long2};
   var ver1 = lat1 * line1[0];
   var ver2 = lat1 * line2[0];
   var spinter = false;
   if (ver1 > 0 && ver2 > 0) {
	   var spinter = intersection1;
   }
   else {
	   var spinter = intersection2;
   }
   return spinter;
}

function findPlane (lat1,long1,lat2,long2) {
   //calculate the Cartesian coordinates (x, y, z) points 1 and 2
   //using their spherical coordinates
   var c1 = sphericalToCartesian(lat1,long1)
   var c2 = sphericalToCartesian(lat2,long2)
   // the point 0 is the center of the earth
   // the plane through 0, c1 and c2 then the equation ax + by + cz = 0
   // a = y1 * z2 - z1 * y2
   // b = z1 * x2 - x1 * z2
   // c = x1 * y2 - y1 * x2
   var a = c1['y'] * c2['z'] - c1['z'] * c2['y'];
   var b = c1['z'] * c2['x'] - c1['x'] * c2['z'];
   var c = c1['x'] * c2['y'] - c1['y'] * c2['x'];
   var plane = {
      'a' : a,
      'b' : b,
      'c' : c
      }
   return plane;
}
   
function sphericalToCartesian (lat,lng) {
   // converts spherical coordinates to cartesian coordinates in a point
   lat = radians(lat); // converts degrees to radians
   lng = radians(lng);
   var x = Math.cos(lat) * Math.cos(lng);
   var y = Math.cos(lat) * Math.sin(lng);
   var z = Math.sin(lat)
   coordinate = {
      'x' : x,
      'y' : y,
      'z' : z
      }
   return coordinate;
}
function radians(el) {
	return deg2rad(el);
}

function deg2rad(dg) {
	return dg/180*π;
}

function rad2deg(rd) {
	return rd*180/π;
}

// retourne l'angle formés par la droite A,B (A=origine, B=destination)
function getAngle(A,B) {
	var Ya = A[0];
	var Xa = A[1];
	var Yb = B[0];
	var Xb = B[1];
	
	// coordonnées d'un point B sur un cercle de centre A: X, Y
	var X = Xb-Xa; // X = côté Adjacent de l'angle a
	var Y = Yb-Ya; // Y = côté Opposé de l'angle a
	
	// calcul sinus et cosinus avec les coordonnées lat, lon
	var H = Math.sqrt((Y*Y)+(X*X));
	
	var cosB = X/H;
	var sinB = Y/H;

	var angleB = Math.acos(Math.abs(cosB)); // angle par rapport à l'horizontale
	if (Number.isNaN(angleB))
		angleB = 0;
	// valeur de l'angle en radian en fonction du signe du sinus et du signe du cosinus
	if (sinB > 0) {
		if (cosB < 0)
			angleB = π - angleB;
	}
	else {
		if (cosB > 0)
			angleB = (2*π)-angleB;
		else
			angleB = π+angleB;
	}

	var angle = angleB;
	return angle;
}

function getCap(objline) {
	var Acoord = new Array(objline.coord[0],objline.coord[1]);
	var Bcoord = new Array(objline.coord[2],objline.coord[3]);
	
	var angle = getAngle(Acoord,Bcoord);
	
	var cap = initialBearingTo(Acoord,Bcoord);

	return cap;
	
	var cap =  (π) - angle;
	if (cap < 0)
		cap = (π*2)+cap;
	objline.cap = rad2deg(cap);
}


/**
 * Returns the initial bearing from ‘this’ point to destination point.
 *
 * @param   {LatLon} point - Latitude/longitude of destination point.
 * @returns {number} Initial bearing in degrees from north (0°..360°).
 *
 * @example
 *   const p1 = new LatLon(52.205, 0.119);
 *   const p2 = new LatLon(48.857, 2.351);
 *   const b1 = p1.initialBearingTo(p2); // 156.2°
 */
function initialBearingTo(point1, point2) {
    // tanθ = sinΔλ⋅cosφ2 / cosφ1⋅sinφ2 − sinφ1⋅cosφ2⋅cosΔλ
    // see mathforum.org/library/drmath/view/55417.html for derivation
	var p1lat = point1[0];
	var p1lon = point1[1];
	var p2lat = point2[0];
	var p2lon = point2[1];

    const φ1 = deg2rad(p1lat);
    const φ2 = deg2rad(p2lat);
    const Δλ = deg2rad(p2lon - p1lon);

    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const θ = Math.atan2(y, x);

    const bearing = rad2deg(θ);

    return wrap360(bearing);
}
/**
 * Constrain degrees to range 0..360 (e.g. for bearings); -1 => 359, 361 => 1.
 *
 * @private
 * @param {number} degrees
 * @returns degrees within range 0..360.
 */
function wrap360(degrees) {
    if (0<=degrees && degrees<360) return degrees; // avoid rounding due to arithmetic ops if within range
    return (degrees%360+360) % 360; // sawtooth wave p:360, a:360
}
