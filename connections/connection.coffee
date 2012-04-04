redis     = require 'redis'
crypto    = require 'crypto'
whiteList = require '../config/actions-white-list'

tokenB = 'kwtpIq1N8/Sp6cYxEvpoQ1sG09FtodXjUb9aW+ahoM0='
tokenBTeacher = 'ml5qmczfz6yovJJXr0L0BEO3Av7jMfanrggteFuwMxo='

class Connection
  constructor: (@socket) ->
    @pub = redis.createClient()
    @sub = redis.createClient()

    @pubConnected = no
    @subConnected = no
    @initCalled = no

    @sub.on 'connect', (b) =>

      if @initCalled and @pubConnected
        @initialize()
      @subConnected = yes

    @pub.on 'connect', (b) =>

      if @initCalled and @subConnected
        @initialize()
      @pubConnected = yes   

    @addEventHandlers()

  tokensAreValid: () ->
    if @studentID
      # Student tokens
      tokB = tokenB
    else
      # Teacher tokens
      tokB = tokenBTeacher

    c = crypto.createHash('sha256').update( @tokenA + tokB ).digest('base64')
    c is @tokenC

  initialize: () ->
    @teacherID = @data.teacherID
    @studentID = @data.studentID
    @tokenA    = @data.tokenA
    @tokenC    = @data.tokenC

    unless @teacherID? and @tokenA? and @tokenC?
      return

    @authorized = @tokensAreValid()

    unless @authorized
      return @socket.disconnect()
      
    @teacherChannel = "teachers.n1.#{@teacherID}"

    if @studentID?
      # sent to just this one student
      @sub.subscribe @studentID

      # sent to all students of @teacherID
      @sub.subscribe "#{@teacherID}.students"

    else
      #sent to teacher
      @sub.subscribe @teacherID

    @sub.on 'message', (channel, msg) =>
      message = JSON.parse msg

      message.date = Date.now()
      @socket.emit 'message', message

    connectMsg = @data
    connectMsg.action = "connect"
    connectMsg.date = Date.now()
    connectMsg = JSON.stringify connectMsg

    @pub.publish @teacherChannel, connectMsg
    @socket.emit 'initialized', true

  init: (@data) ->
    if @subConnected and @pubConnected
      @initialize()

    @initCalled = yes

  addEventHandlers: () ->
    @socket.on 'init', (data) =>
      @init data

    @socket.on 'message', (data) =>

      if data.action and whiteList[data.action]? and @authorized
        permission = no

        if whiteList[data.action] is '0'
          # teacher only
          permission = not @studentID?
        else if whiteList[data.action] is '1'
          # student only
          permission = @studentID?
        else if whiteList[data.action] is '2'
          # both
          permission = yes

        if permission

          data.date = Date.now()
          data = JSON.stringify data

          @pub.publish @teacherChannel, data


  disconnect: () ->
    disconnectMsg =
      action    : 'disconnect'
      teacherID : @teacherID
      date      : Date.now()

    if @studentID?
      disconnectMsg.studentID = @studentID

    disconnectMsg = JSON.stringify disconnectMsg

    if @teacherID?
      #if client disconnects before init, no need to publish it

      @pub.publish @teacherChannel, disconnectMsg

    @pub.quit()
    @sub.unsubscribe()
    @sub.quit()

 

exports.connection = Connection