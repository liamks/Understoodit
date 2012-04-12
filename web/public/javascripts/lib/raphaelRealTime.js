/*
Liam Kaufman
April 2012
*/

/*
getAnchors uses getAnchors function from teh analytics example
on raphaeljs.com.
*/
Raphael.fn.getAnchors = function(p1x, p1y, p2x, p2y, p3x, p3y) {
    var l1 = (p2x - p1x) / 2,
        l2 = (p3x - p2x) / 2,
        a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
        b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
    a = p1y < p2y ? Math.PI - a : a;
    b = p3y < p2y ? Math.PI - b : b;
    var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
        dx1 = l1 * Math.sin(alpha + a),
        dy1 = l1 * Math.cos(alpha + a),
        dx2 = l2 * Math.sin(alpha + b),
        dy2 = l2 * Math.cos(alpha + b);
    return {
        x1: p2x - dx1,
        y1: p2y + dy1,
        x2: p2x + dx2,
        y2: p2y + dy2
    };
}

Raphael.fn.drawGrid = function(){
  var w = this.width,
      interval = 50,
      numLines = 6, // 100, 80, 60, 40, 20, 0
      startY = 25,
      path = [],
      labelValue = 100;

  for (var i = numLines - 1; i >= 0; i--) {
    path = path.concat([
      "M", 0, startY,
      "L", w - 2, startY
    ])

    this.text(20, startY - 10, String(labelValue - (20 * (5 - i))) + "%").attr({'font-size':'15'})
    startY += interval;
  };

  return this.path(path).attr({stroke : '#444', 'stroke-width': 2});
};

Raphael.fn.getY = function(value){
  var topEdge = 25,
      height = 50 * 5,
      bottomEdge = topEdge + height;

  return bottomEdge - Math.floor(height * value/100);
}

Raphael.fn.placeTimeLabel = function(x, t){
  var bottomEdge = 25 + 50 * 5 + 12,
      date = new Date(t),
      hour = date.getHours() % 12,
      minutes = date.getMinutes(),
      label = hour + ":" + minutes;
  this.text(x, bottomEdge, label).attr({'font-size':'12'})
}

Raphael.fn.drawPoint = function(x, y, color, useCircle){
  if(useCircle){
    this.circle(x, y, 5).attr({fill: color, stroke: color, 'stroke-width':2})
  }else{
    this.rect(x - 4, y -4, 8, 8).attr({fill: color, stroke: color, 'stroke-width':2})
  }
}

Raphael.fn.drawSeries = function(color, useCircle, labelX){
  var xInterval = 25,
      x = 2 * xInterval,
      y, x0, y0, x2, y2, anchors, path;

  for(var i = 0, len = this.values.length; i < len; i++){
    y = this.getY(this.values[i][1]);

    if(i%3 == 0 && labelX){
      this.placeTimeLabel(x, this.values[i][0]);
    };

    if(i == 0){
      path = ["M", x, y, "C", x, y];
    }else if(i < len - 1){
      //Not first OR last element
      // X and Y that fall before the present point
      x0 = x - xInterval;
      y0 = this.getY(this.values[i - 1][1]);

      // X and Y that fall after the present point
      x2 = x + xInterval;
      y2 = this.getY(this.values[i + 1][1]);

      anchors = this.getAnchors( x0, y0, x, y, x2, y2 );
      path = path.concat([anchors.x1, anchors.y1, x, y, anchors.x2, anchors.y2]);
    }

    this.drawPoint(x, y, color, useCircle);
    x += xInterval;
  };

  x -= xInterval;
  path = path.concat([x, y, x, y]);
  return this.path(path).attr({stroke : color || 'green', 'stroke-width':3})
};

Raphael.fn.addValues = function(values){
  this.values = values;
}

Raphael.fn.numValues = function(){
   return Math.floor((this.width - (2 * 25))/25);
}

/*
USE: 
var r = new Raphael('target');
r.drawGrid();
var data = [
  [Date.now(), 100],
  [Date.now() + 1000, 80]];
data = data.slice( Math.max(data.length - r.numValues(), 0) );
r.addValues(data);
r.drawSeries('green', true, true);
*/