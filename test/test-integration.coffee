mocha   = require 'mocha'
should  = require 'should'
io      = require 'socket.io-client'
redis   = require 'redis'

connectionsServer  = require '../connections/connections-server'
teachersServer    = require '../teachers/teachers-server'

socketURL = 'http://0.0.0.0:5000'
socketOptions =
  transports: [ 'websocket' ]
  'force new connection' : true

scaffold = require './scaffold'

teacher1 = scaffold.teacher1

student1 = scaffold.student1
student2 = scaffold.student2
student3 = scaffold.student3

student1Confused = scaffold.student1Confused
student2Confused = scaffold.student2Confused

teacher1Settings = scaffold.teacher1Settings

student1Understood = scaffold.student1Understood

teacher1Channel = teacher1.teacherID
studentBroadcastChannel = "#{teacher1.teacherID}.students"

process.env.NODE_ENV = 'test'

describe "Scenario One", () ->
  Connections = connectionsServer.connections
  Teachers = teachersServer.teachers
  connections = undefined
  teachers = undefined
  clientTeacher1 = undefined
  clientTeacher1a = undefined
  clientStudent1 = undefined
  clientStudent2 = undefined
  clientStudent3 = undefined
  sub = undefined

  before (done) ->
    sub = redis.createClient()
    sub.psubscribe '*'
    connections = new Connections()
    teachers = new Teachers()

    teachers.start () ->
      connections.start()
      done()

  after (done) ->
    connections.stop()
    teachers.stop()
    done()

  describe "Student1 Connects", () ->
    before (done) ->
      clientStudent1 = io.connect socketURL, socketOptions
      clientStudent1.on 'connect', () ->
        done()

    it "Should connect student and received initialized event", (done) ->
      clientStudent1.once 'initialized', (msg) ->
        done()

      clientStudent1.emit 'init', student1


  describe "Teacher1 Connects", () ->
    before (done) ->
      clientTeacher1 =  io.connect socketURL, socketOptions
      clientTeacher1.on 'connect', () ->
        done()

    it "Should initialize and start the lecture", (done) ->
      initialized = no 
      started = no

      #Also need to check and see if "start" as been published
      handleMessage = (pattern, channel, msg) ->
        message = JSON.parse msg
        if message.action is 'start'
          if initialized
            done()
          else
            started = yes
          sub.removeListener 'pmessage', handleMessage

      clientTeacher1.once  'initialized', (msg) ->
        if started
          done()  
        else
          initialized = yes

      sub.on 'pmessage', handleMessage
      clientTeacher1.emit 'init', teacher1

    it "Should get status updates with numStudents == 1", (done) ->

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1.removeListener 'message', handleLectureState
          message.numStudents.should.equal 1
          done()

      clientTeacher1.on 'message', handleLectureState


  describe "Student2 Connects", () ->
    before (done) ->
      clientStudent2 = io.connect socketURL, socketOptions 
      clientStudent2.on 'connect', () ->
        done()

    it "Should be initialized", (done) ->
      clientStudent2.once 'initialized', (msg) ->
        done()

      clientStudent2.emit 'init', student2

    it "Should get status updates with numStudents == 2", (done) ->

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1.removeListener 'message', handleLectureState
          message.numStudents.should.equal 2
          done()

      clientTeacher1.on 'message', handleLectureState

  describe "Student3 Connects", () ->
    before (done) ->
      clientStudent3 = io.connect socketURL, socketOptions 
      clientStudent3.on 'connect', () ->
        done()

    it "Should be initialized", (done) ->
      clientStudent3.once 'initialized', (msg) ->
        done()

      clientStudent3.emit 'init', student3

    it "Should get status updates with numStudents == 3", (done) ->

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1.removeListener 'message', handleLectureState
          message.numStudents.should.equal 3
          done()

      clientTeacher1.on 'message', handleLectureState


  describe "Student2 is Confused", () ->
    before (done) ->
      clientStudent2.emit 'message', student2Confused
      done()

    it "Should send confusion levels to teacher", (done) ->
      statesReceived = 0
      previousConfusion = 100

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          statesReceived += 1
          message.numStudents.should.equal 3
          condition = message.confusion <= previousConfusion
          condition.should.be.true
          previousConfusion = message.confusion
          if statesReceived is 2
            clientTeacher1.removeListener 'message', handleLectureState
            done()

      clientTeacher1.on 'message', handleLectureState

    it "Should not send confusion levels to student", (done)->
      studentHasReceivedLectureState = no

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          studentHasReceivedLectureState = yes

      checkCondition = () ->
        studentHasReceivedLectureState.should.be.false
        clientStudent1.removeListener 'message', handleLectureState
        done()
      
      clientStudent1.on 'message', handleLectureState
      setTimeout checkCondition, 41


  describe "Student1 is Confused", () ->
    before (done) ->
      clientStudent1.emit 'message', student1Confused
      done()

    it "Should send confusion levels to teacher", (done) ->
      statesReceived = 0
      previousConfusion = 100

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          statesReceived += 1
          message.numStudents.should.equal 3
          condition = message.confusion <= previousConfusion
          condition.should.be.true
          previousConfusion = message.confusion
          if statesReceived is 2
            clientTeacher1.removeListener 'message', handleLectureState
            done()

      clientTeacher1.on 'message', handleLectureState

    it "Should not send confusion levels to student", (done)->
      studentHasReceivedLectureState = no

      handleLectureState = (message) ->
        if message.action is 'lecture state'
          studentHasReceivedLectureState = yes

      checkCondition = () ->
        studentHasReceivedLectureState.should.be.false
        clientStudent1.removeListener 'message', handleLectureState
        done()
      
      clientStudent1.on 'message', handleLectureState
      setTimeout checkCondition, 41

  describe "Teacher1 connects again", () ->
    before (done) ->
      clientTeacher1a =  io.connect socketURL, socketOptions
      clientTeacher1a.on 'connect', () ->
        done()

    it "Should initialize", (done) ->
      clientTeacher1a.once 'initialized', (msg) ->
        done()

      clientTeacher1a.emit 'init', teacher1

    it "Should send state to teacher1", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1.removeListener 'message', handleLectureState
          message.numStudents.should.equal 3
          done()

      clientTeacher1.on 'message', handleLectureState

    it "Should send state to teacher1a", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1a.removeListener 'message', handleLectureState
          message.numStudents.should.equal 3
          done()

      clientTeacher1a.on 'message', handleLectureState


  describe "Teacher1 updates settings", () ->
    it "Should broadcast settings to both teachers", (done) ->
      
      oneReceived = no
      oneAReceived = no

      checkDone = () ->
        if oneReceived and oneAReceived
          clientTeacher1.removeListener 'message', handleSettingsForOne
          clientTeacher1a.removeListener 'message', handleSettingsForOneA
          done()

      handleSettingsForOne = (message) ->
        if message.action is 'settings'
          message.studentsCanSeeComprehension.should.be.true
          oneReceived = yes
          checkDone()

      handleSettingsForOneA = (message) ->
        if message.action is 'settings'
          message.studentsCanSeeComprehension.should.be.true
          oneAReceived = yes
          checkDone()

      clientTeacher1.on 'message', handleSettingsForOne 
      clientTeacher1a.on 'message', handleSettingsForOneA
      clientTeacher1.emit 'message', teacher1Settings

    it "Should broadcast confusion to students", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          message.confusion.should.be.above 0
          should.not.exist message.numStudents
          clientStudent1.removeListener 'message', handleLectureState
          done()

      clientStudent1.on 'message', handleLectureState    
 

  describe "Student2 disconnects", () ->
    before (done) ->
      clientStudent2.disconnect()
      done()

    it "Should broadcast that only 2 students are connected", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1a.removeListener 'message', handleLectureState
          message.numStudents.should.equal 2
          done()

      clientTeacher1a.on 'message', handleLectureState

  describe "Student1 understands", () ->
    before (done) ->
      clientStudent1.emit 'message', student1Understood
      done()

    it "Should broadcast confusion and understanding levels to teacher", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1.removeListener 'message', handleLectureState
          message.numStudents.should.equal 2
          message.understanding.should.be.above 0

          done()

      clientTeacher1.on 'message', handleLectureState


    it "Should broadcast confusion and understanding levels to student", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientStudent1.removeListener 'message', handleLectureState
          should.not.exist message.numStudents
          message.understanding.should.be.above 0
    
          done()

      clientStudent1.on 'message', handleLectureState

  describe "Student3 disconnects", () ->
    before (done) ->
      clientStudent3.disconnect()
      done()

    it "Should broadcast that only 1 student is connected", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1a.removeListener 'message', handleLectureState
          message.numStudents.should.equal 1
          message.understanding.should.be.above 0
          done()

      clientTeacher1a.on 'message', handleLectureState

  describe "Student1 disconnects", () ->
    before (done) ->
      clientStudent1.disconnect()
      done()

    it "Should broadcast that 0 students are connected", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1.removeListener 'message', handleLectureState
          message.numStudents.should.equal 0
          message.understanding.should.equal 0
          done()

      clientTeacher1.on 'message', handleLectureState

  describe "Teacher1, instance 1, disconnects", () ->
    before (done) ->
      clientTeacher1.disconnect()
      done()

    it "Should still report to Teacher1a", (done) ->
      handleLectureState = (message) ->
        if message.action is 'lecture state'
          clientTeacher1a.removeListener 'message', handleLectureState
          message.numStudents.should.equal 0
          message.understanding.should.equal 0
          done()

      clientTeacher1a.on 'message', handleLectureState


  describe "Teacher1, instance 2, disconnects", () ->

    it "Should broadcast stop", (done) ->
      handleMessage = (pattern, channel, msg) ->
        message = JSON.parse msg

        if message.action is 'stop'
          sub.removeListener 'pmessage', handleMessage
          done()

      sub.on 'pmessage', handleMessage
      clientTeacher1a.disconnect()

