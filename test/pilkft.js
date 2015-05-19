/**
*  
*  Pyramidal Implementation of the Lucas Kanade Feature Tracker
*                                by Sneezry, 2014-11-12
*                                lizhe@lizhe.org
*                                MIT License
*  
*  Parameters:
*    u:        Feature Points of the 1st Image
*                [
*                  {x:x0, y:y0},
*                  {x:x1, y:y1},
*                  ...
*                ]
*    I:        1st Image Array
*                [
*                  [I00, I01, ...],
*                  [I10, I11, ...],
*                  ...
*                ]
*    J:        2nd Image Array
*                [
*                  [J00, J01, ...],
*                  [J10, J11, ...],
*                  ...
*                ]
*
*  Output:
*    v:        Optical Flow
*                [
*                  {x:x0, y:y0, v:{x:u0, y:v0}},
*                  {x:x1, y:y1, v:{x:u1, y:v1}},
*                  ...
*                ]
*
**/

function pilkft(u, I, J) {
  var height = I.length; // Width of the Image
  var width = I[0].length; // Height of the Image
  var L = 4; // Max Level
  var S = 5; // Max Step of Each Level
  var hW = 3; // Half Width of Local Window
              // the Entire Width is hW*2+1
  var IL = []; // Array of Levels of 1st Image Array
  IL.push(I); // IL[0] is I, the 0 Level
  var JL = []; // Array of Levels of 2nd Image Array
  JL.push(J); // JL[0] is J, the 0 Level
  
  // Let's copy I to IT and J to JT completely
  var IT = [];
  var JT = [];
  for(var y=0; y<height; y++) {
    IT[y] = [];
    JT[y] = [];
    for(var x=0; x<width; x++) {
      IT[y][x] = I[y][x];
      JT[y][x] = J[y][x];
    }
  }
  
  // Now let's calculate every level image of I and J
  for(var l=1; l<L; l++) {
    var heightl = Math.floor(IT.length/2);
    var widthl = Math.floor(IT[0].length/2);
    var Il = [];
    var Jl = [];
    for(var y=0; y<heightl; y++) {
      Il[y] = [];
      Jl[y] = [];
      for(var x=0; x<widthl; x++) {
        Il[y][x] = IT[y*2][x*2]/4 +
                   IT[y*2][Math.max(0,x*2-1)]/8 +
                   IT[y*2][Math.min(widthl-1,x*2+1)]/8 +
                   IT[Math.max(0,y*2-1)][x*2]/8 +
                   IT[Math.min(heightl-1,y*2+1)][x*2]/8 +
                   IT[Math.max(0,y*2-1)][Math.max(0,x*2-1)]/16 +
                   IT[Math.max(0,y*2-1)][Math.min(widthl-1,x*2+1)]/16 +
                   IT[Math.min(heightl-1,y*2+1)][Math.max(0,x*2-1)]/16 +
                   IT[Math.min(heightl-1,y*2+1)][Math.min(widthl-1,x*2+1)]/16;
        Jl[y][x] = JT[y*2][x*2]/4 +
                   JT[y*2][Math.max(0,x*2-1)]/8 +
                   JT[y*2][Math.min(widthl-1,x*2+1)]/8 +
                   JT[Math.max(0,y*2-1)][x*2]/8 +
                   JT[Math.min(heightl-1,y*2+1)][x*2]/8 +
                   JT[Math.max(0,y*2-1)][Math.max(0,x*2-1)]/16 +
                   JT[Math.max(0,y*2-1)][Math.min(widthl-1,x*2+1)]/16 +
                   JT[Math.min(heightl-1,y*2+1)][Math.max(0,x*2-1)]/16 +
                   JT[Math.min(heightl-1,y*2+1)][Math.min(widthl-1,x*2+1)]/16;
      }
    }
    IL.push(Il);
    IT = Il;
    JL.push(Jl);
    JT = Jl;
  }
  
  // Initial Optical Flow of Every Level to Zero
  var uL = [];
  for(var l=0; l<L; l++) {
    uL[l] = [];
    for(var k=0; k<u.length; k++) {
      uL[l][k] = {
        x: u[k].x/(1<<l),
        y: u[k].y/(1<<l),
        v: {x:0, y:0}
      }
    }
  }

  for(var k=0; k<u.length; k++) {
    for(var l=L-1; l>=0; l--) { // Level Loop
      var height = IL[l].length;
      var width = IL[l][0].length;
      // Let Initial Optical Flow of Level l be twice that of last Level
      if(l+1 != L){
        uL[l][k].v.x = uL[l+1][k].v.x * 2;
        uL[l][k].v.y = uL[l+1][k].v.y * 2;
      }

      // Calculate Optical Flow of Level l and Step s
      for(var s=0; s<S; s++) { // Step Loop
        // Calculate Jxx Jyy and Jxy nearly uL[l][k]
        var minY = uL[l][k].y - hW;
        var maxY = uL[l][k].y + hW;
        var minX = uL[l][k].x - hW;
        var maxX = uL[l][k].x + hW;
        var Jxx = 0;
        var Jyy = 0;
        var Jxy = 0;
        var Jtx = 0;
        var Jty = 0;

        /*
        *
        * Notice!
        *            | Jxx  Jxy |
        * Matrix G = |          |
        *            | Jxy  Jyy |
        *
        *             | Jtx |
        * vector b = -|     |
        *             | Jty |
        *
        * Then we have equation below:
        *
        * delta(v) = (G^-1)b
        *
        */
        for(var y=Math.max(minY,0); y<Math.min(maxY,height); y++) {
          for(var x=Math.max(minX,0); x<Math.min(maxX,width); x++) {
            var xs = x+uL[l][k].v.x;
            var ys = y+uL[l][k].v.y;

            // x, y, xs and ys may not be integer
            // so we need interpolation to calculate Jx, Jy and Jt
            var xl = Math.floor(xs);
            var xr = xl+1;
            var yt = Math.floor(ys);
            var yb = yt+1;

            var xli = Math.floor(x);
            var xri = xli+1;
            var yti = Math.floor(y);
            var ybi = yti+1;
            
            // The point is out of the image, let's ignore it
            if(xl-1<0 || xr+1>width-1 || yt-1<0 || yb+1>height-1 ||
               xli-1<0 || xri+1>width-1 || yti-1<0 || ybi+1>height-1){
            	continue;
            }

            /*
            *                (xl, yt-1)  (xr, yt-1)
            *                      (xs, ys-1)
            *     (xl-1, yt)   (xl, yt)  (xr, yt)   (xr+1, yt)
            *          (xs-1, ys)   (xs, ys)  (xs+1, ys)
            *     (xl-1, yb)   (xl, yb)  (xr, yb)   (xr+1, yb)
            *                      (xs, ys+1)
            *                (xl, yb+1)  (xr, yb+1)
            */
            var Jxr = (JL[l][yb][xr+1]*(xs-xl) - JL[l][yb][xr]*(xs-xl-1))*(ys-yt) - 
                      (JL[l][yt][xr+1]*(xs-xl) - JL[l][yt][xr]*(xs-xl-1))*(ys-yt-1);
            var Jxl = (JL[l][yb][xl]*(xs-xl) - JL[l][yb][xl-1]*(xs-xl-1))*(ys-yt) - 
                      (JL[l][yt][xl]*(xs-xl) - JL[l][yt][xl-1]*(xs-xl-1))*(ys-yt-1);
            var Jx = (Jxr-Jxl)/2;

            var Jyb = (JL[l][yb+1][xr]*(ys-yt) - JL[l][yb][xr]*(ys-yt-1))*(xs-xl) - 
                      (JL[l][yb+1][xl]*(ys-yt) - JL[l][yb][xl]*(ys-yt-1))*(xs-xl-1);
            var Jyt = (JL[l][yt][xr]*(ys-yt) - JL[l][yt-1][xr]*(ys-yt-1))*(xs-xl) - 
                      (JL[l][yt][xl]*(ys-yt) - JL[l][yt-1][xl]*(ys-yt-1))*(xs-xl-1);
            var Jy = (Jyb-Jyt)/2;

            var Jtj = (JL[l][yb][xr]*(xs-xl) - JL[l][yb][xl]*(xs-xl-1))*(ys-yt) - 
                      (JL[l][yt][xr]*(xs-xl) - JL[l][yt][xl]*(xs-xl-1))*(ys-yt-1);
            var Jti = (IL[l][ybi][xri]*(x-xli) - IL[l][ybi][xli]*(x-xli-1))*(y-yti) - 
                      (IL[l][yti][xri]*(x-xli) - IL[l][yti][xli]*(x-xli-1))*(y-yti-1);
            var Jt = Jti - Jtj;

            Jxx += Jx*Jx;
            Jyy += Jy*Jy;
            Jxy += Jx*Jy;
            Jtx += Jt*Jx;
            Jty += Jt*Jy;
          }
        }

        // Calculate dalta(v), and update v to v+delat(v)
        if(Jxx*Jyy-Jxy*Jxy){
          uL[l][k].v.x += (Jyy*Jtx-Jxy*Jty)/(Jxx*Jyy-Jxy*Jxy);
          uL[l][k].v.y += (Jxx*Jty-Jxy*Jtx)/(Jxx*Jyy-Jxy*Jxy);
        }
      }
    }
  }
  return uL[0];
}
