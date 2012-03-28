mocha   = require 'mocha'
should  = require 'should'
io      = require 'socket.io-client'
server  = require '../connections/connections-server'
redis   = require 'redis'
crypto  = require 'crypto'

whiteList = require '../config/actions-white-list'
socketURL = 'http://0.0.0.0:5000'
socketOptions =
  transports: [ 'websocket' ]
  'force new connection' : true


tokenA = crypto.createHash('sha256').update(Date.now().toString()).digest('base64')
tokenB = 'kwtpIq1N8/Sp6cYxEvpoQ1sG09FtodXjUb9aW+ahoM0='
tokenC = crypto.createHash('sha256').update( tokenA + tokenB ).digest('base64')


process.env.NODE_ENV = 'test'

teacher1 =
  teacherID : "tom3456"
  tokenA    : tokenA
  tokenC    : tokenC

student1 =
  studentID : "jane1456"
  teacherID : teacher1.teacherID
  tokenA    : tokenA
  tokenC    : tokenC


confused =
  action: 'confused'
  studentID: student1.studentID

understood =
  action : 'understood'
  studentID: student1.studentID

settings =
  action : 'settings'
  teacherID : teacher1.teacherID
  settings : {}

state =
  action : 'lecture state'
  numberOfStudents : 4
  active: 3
  confusion : 0
  understanding: 80




describe "Connections", () ->
  Connections = server.connections
  connections = undefined
  client = undefined
  sub = undefined
  pub = undefined

  
  before (done) ->
    connections = new Connections()
    connections.start()
    sub = redis.createClient()
    sub.psubscribe '*'
    pub = redis.createClient()
    done()

  after (done) ->  
    connections.stop()
    sub.quit()
    pub.quit()
    done()

  describe "Connect & Disconnect", () ->

    before (done) ->
      client = io.connect socketURL, socketOptions
      done()

    it "Should allow action connect for student", (done) ->
      sub.once 'pmessage', (pattern, channel, msg) =>
        message = JSON.parse msg
        message.studentID.should.equal student1.studentID
        message.teacherID.should.equal teacher1.teacherID
        message.action.should.equal "connect"
        channel.should.equal "teachers.n1.#{teacher1.teacherID}"
        done()
      client.emit 'init', student1

    it "Should allow action disconnect", (done) ->
      handleMessage = (pattern, channel, msg) ->
        message = JSON.parse msg
        if message.action is "disconnect"
          message.teacherID.should.equal teacher1.teacherID
          message.studentID.should.equal student1.studentID
          channel.should.equal "teachers.n1.#{teacher1.teacherID}"
          sub.removeListener 'pmessage', handleMessage
          done()

      # Must initialize client first
      client.emit 'init', student1

      # add redis handler
      sub.on 'pmessage', handleMessage
      client.disconnect()

  describe "Sending Student Actions", () ->
    before (done) ->
      client = io.connect socketURL, socketOptions
      client.emit 'init', student1
      client.once 'initialized', () ->
        done()
      
    after (done) ->
      client.disconnect()
      done()

    it "Should allow action confused for student", (done) ->
      handleConfusion = (pattern, channel, msg) ->
        message = JSON.parse msg
        if message.action is 'confused'
          message.studentID.should.equal student1.studentID
          should.exist message.date
          sub.removeListener 'pmessage', handleConfusion
          done()

      sub.on 'pmessage', handleConfusion
      client.emit 'message', confused


    it "Should allow action understood for student", (done) ->
      handleUnderstood = (pattern, channel, msg) ->
        message = JSON.parse msg
        if message.action is 'understood'
          should.exist message.date
          sub.removeListener 'pmessage', handleUnderstood
          done()

      sub.on 'pmessage', handleUnderstood
      client.emit 'message', understood

  describe "Sending Teacher Actions", () ->
    before (done) ->
      client = io.connect socketURL, socketOptions
      client.emit 'init', teacher1
      client.once 'initialized', () ->
        done()
      
    after (done) ->
      client.disconnect()
      done()

    it "Should allow action settings", (done) ->
      handleSettings = (pattern, channel, msg) ->
        message = JSON.parse msg

        if message.action is 'settings'
          should.exist message.date
          should.exist message.settings
          sub.removeListener 'pmessage', handleSettings
          done()

      sub.on 'pmessage', handleSettings
      client.emit 'message', settings


    it "Should not allow an empty action", (done) ->
      receivedEmptyAction = no
      handleSub = (pattern, channel, msg) ->
        message = JSON.parse msg

        if not message.action? or message.action is ''
          receivedEmptyAction = yes

      hasReceivedEmptyAction = ->
        if receivedEmptyAction is no
          sub.removeListener 'pmessage', handleSub
          done()

      sub.on 'pmessage', handleSub
  
      client.emit 'message', {action:''}
      client.emit 'message', {}
      setTimeout hasReceivedEmptyAction, 40

    it "Should not allow a non white listed action", (done) ->
      receivedNonWhiteListedAction = no
      handleSub = (pattern, channel, msg) ->
        message = JSON.parse msg

        if not whiteList[message.action]?
          receivedNonWhiteListedAction= yes

      hasReceivedNonWhiteListedAction = ->
        if receivedNonWhiteListedAction is no
          sub.removeListener 'pmessage', handleSub
          done()

      sub.on 'pmessage', handleSub
      client.emit 'message', {action:'a non white list action'}
      client.emit 'message', {action: 'another action'}
      setTimeout hasReceivedNonWhiteListedAction, 40


  describe "Receiving Teacher Actions", () ->
    before (done) ->
      client = io.connect socketURL, socketOptions
      client.emit 'init', teacher1
      client.once 'initialized', () ->
        done()
      
    after (done) ->
      client.disconnect()
      done()

    it "Should send the teacher's socket the settings", (done) ->
      client.once 'message', (data) ->
        should.exist data.settings
        client.removeListener 'message'
        done()

      settings = JSON.stringify settings
      channel = teacher1.teacherID

      pub.publish channel, settings

    it "Should send the lecture's state to the socket", (done) ->
      client.once 'message', (data) ->
        should.exist data.date
        data.action.should.equal state.action
        done()

      stateM = JSON.stringify state
      channel = teacher1.teacherID

      pub.publish channel, stateM

  describe "No Token", () ->
    before (done) ->
      teach = teacher1
      teach.tokenA = undefined
      teach.tokenC = undefined
      client = io.connect socketURL, socketOptions
      client.emit 'init', teacher1
      done()

    after (done) ->
      client.disconnect()
      done()

    it 'Should be disconnected', (done) ->
      client.socket.connected.should.be.false
      done()


