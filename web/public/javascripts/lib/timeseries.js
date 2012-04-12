function TimeSeries(id){
  this.$el = $('#' + id)
  this.canvas = document.getElementById(id);
  this.canvas.height = 300;
  this.canvas.width = 958;
  this.height = this.$el.height();
  this.width = this.$el.width();
  this.topBorder = 25;
  this.seriesHeight = 50 * 5;
  this.bottomEdge = this.topBorder + this.seriesHeight;
  this.ctx = this.canvas.getContext('2d');
  this.confusedPoints = [];
  this.understoodPoints = [];
  this.timePoints = [];
  this.pointsCounter = 0
  this.drawGrid();
}

TimeSeries.prototype.line = function(x1, y1, x2, y2, color){
  this.ctx.beginPath();
  this.ctx.moveTo(x1, y1);
  this.ctx.lineTo(x2, y2);
  this.ctx.strokeStyle = color;
  this.ctx.stroke();
}

TimeSeries.prototype.drawGrid = function(){
  var numLines = 6,
      interval = 50,
      y = this.topBorder,
      labelValue = 100,
      txt;

  this.ctx.font = "16pt 'VAG Rundschrift Light'"
  for (var i = 0; i < numLines; i++) {
    this.line(0.5, y + 0.5, this.width , y + 0.5, '#bbb');

    txt = String(labelValue - (20 * i)) + "%";
    this.ctx.fillText(txt, 5, y - 2);
    y += interval;
  };
  this.ctx.font = "12pt 'VAG Rundschrift Light'"
  this.imgWithGrid = new Image();
  this.imgWithGrid.src = this.canvas.toDataURL();
}


TimeSeries.prototype.getY = function(percentage){
  return this.bottomEdge - Math.floor(this.seriesHeight * percentage/100);
}

TimeSeries.prototype.numPoints = function(){
  return Math.floor((this.width - 50)/25);
}

TimeSeries.prototype.rectangle = function(x, y, color){
  this.ctx.fillStyle = color;
  this.ctx.fillRect(x - 4, y - 4, 8, 8);
}

TimeSeries.prototype.circle = function(x, y, color){
  this.ctx.beginPath();
  this.ctx.arc(x, y, 5, 0, Math.PI * 2, false);
  this.ctx.fillStyle = color;
  this.ctx.fill();

}

TimeSeries.prototype.labelXAxis = function(x,t){
  var t, hour, minutes, label;
  this.ctx.fillStyle = '#000'
  t = new Date(t);
  hour = t.getHours() % 12;
  hour = hour == 0 ? 12 : hour;
  minutes = t.getMinutes();
  label = hour + ':' + (minutes < 10 ? '0' + minutes : minutes);
  this.ctx.fillText(label, x - 20, this.bottomEdge + 20);
      

}

TimeSeries.prototype.draw = function(array, isConfused, color){
  
  var startI = Math.max(array.length - this.numPoints(), 0),
      x1,y1,x2,y2, xInterval = 25, c = 0;

      x2 = 2 * xInterval;

  this.ctx.lineWidth = 2
  for(var i = startI; i < array.length; i++, c++){
    y2 = array[i];
    
    if(isConfused && c%3 == 0){

      this.labelXAxis(x2, this.timePoints[i]);
    } 

    if(isConfused){
      this.rectangle(x2, y2, color);
    }else{
      this.circle(x2, y2, color);
    }
    
    if(i != startI){
      x1 = x2 - xInterval;
      y1 = array[i - 1];
      this.line(x1, y1, x2, y2, color);
    }

    x2 += xInterval;
  };
}



TimeSeries.prototype.drawAll = function(){
  this.ctx.clearRect(0, 0, this.width, this.height)
  this.ctx.drawImage(this.imgWithGrid, 0, 0);
  this.draw(this.confusedPoints, true, 'red');
  this.draw(this.understoodPoints, false, 'green');
}

TimeSeries.prototype.addPoint = function(pointC, pointU, time){
  if(this.pointsCounter == 0){

    this.confusedPoints.push( this.getY(pointC) );
    this.understoodPoints.push( this.getY(pointU) );
    this.timePoints.push(time)

    if(this.timePoints.length > 40){
      this.confusedPoints.shift();
      this.understoodPoints.shift();
      this.timePoints.shift();
    }

    this.drawAll();
  }

  this.pointsCounter += 1;
  if(this.pointsCounter == 60){
    this.pointsCounter = 0;
  }
}

/* USE

var ts = new TimeSeries('target');

var x = 1334196364161;
var min = 1000 * 60;


ts.addPoint(10, 15, x + min * 1);
ts.addPoint(23, 4,  x + min * 2);
ts.addPoint(47, 12, x + min * 3);
ts.addPoint(78, 43, x + min * 4);
 */

