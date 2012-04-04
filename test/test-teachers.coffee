mocha   = require 'mocha'
should  = require 'should'
server  = require '../teachers/teachers-server'
redis   = require 'redis'

process.env.NODE_ENV = 'test'

teacher1 =
  teacherID : "tom3456"

teacher2 =
  teacherID : "sally3456"

student1 =
  teacherID : teacher1.teacherID
  studentID : "aStudent234"

student2 =
  teacherID : teacher1.teacherID
  studentID : "anotherStudent34"

connectTeacher1 =
  teacherID : teacher1.teacherID
  action    : 'connect'

disconnectTeacher1 =
  teacherID : teacher1.teacherID
  action    : 'disconnect'

connectStudent1 =
  teacherID : teacher1.teacherID
  studentID : student1.studentID
  action    : 'connect'

disconnectStudent1 =
  teacherID : teacher1.teacherID
  studentID : student1.studentID
  action    : 'disconnect'

confusedStudent1 = 
  teacherID : teacher1.teacherID
  studentID : student1.studentID
  action    : 'confused'
  date      : Date.now()

understoodStudent1 =
  teacherID : teacher1.teacherID
  studentID : student1.studentID
  action    : 'understood'
  date      : Date.now()

settingsTeacher1 =
  teacherID : teacher1.teacherID
  action    : 'settings'
  studentsCanSeeComprehension      : yes


describe "Teachers", () ->
  pub = undefined
  sub = undefined
  Teachers = server.teachers
  teachers = undefined
  teacherChannel = teacher1.teacherID
  studentChannel = teacher1.teacherID + ".students"

  before (done) ->
    teachers = new Teachers()

    pub = redis.createClient()
    sub = redis.createClient()

    sub.on 'connect', () ->
      sub.subscribe teacherChannel
      sub.subscribe studentChannel
      sub.psubscribe "databases.n1.*"
      teachers.start () ->
        done()

  after (done) ->
    teachers.stop()
    pub.quit()
    sub.quit()
    done()

  describe "Start and Stopping Lectures", () ->
    before (done) ->
      ###
        Without the wait, the first test will fail ~ 1/5 times,
        with 'done()' being executed multiple times. For whatever reason
        the handler from the first test gets executed in the second test.

        Even when the two tests are swapped, the one executed first will fail.
        IT seems that the bug is just for the test that executes first
      ###
      wait = () ->
        done()
      setTimeout wait, 5


    it "Should start when a teacher connects", (done) ->

      chnl = "teachers.n1." + teacher1.teacherID
      msg = JSON.stringify connectTeacher1
      
      messageHandler = (channel, msg) ->
        message = JSON.parse msg

        if message.action is 'start'
          sub.removeListener 'message', messageHandler
          channel.should.equal studentChannel
          
          # Disconnect Teacher
          msg = JSON.stringify disconnectTeacher1
          pub.publish chnl, msg
          done()

      sub.on 'message', messageHandler
      
      chnl = "teachers.n1." + teacher1.teacherID
      msg = JSON.stringify connectTeacher1
      pub.publish chnl, msg

      

    it "Should stop when a teacher disconnects", (done) ->
      handleDisconnect = (channel, msg) ->
        message = JSON.parse msg
        if message.action is 'stop'
       
          channel.should.equal studentChannel
          sub.removeListener 'message', handleDisconnect
          done()

      sub.on 'message', handleDisconnect

      # Connect
      chnl = "teachers.n1." + teacher1.teacherID
      msg = JSON.stringify connectTeacher1
      pub.publish chnl, msg

      # Disconnect
      msg = JSON.stringify disconnectTeacher1
      pub.publish chnl, msg

  describe "Students Connecting", () ->
    it "Should not connect when a teacher is not connected", (done) ->
      studentConnected = no
      chnl = "teachers.n1." + teacher1.teacherID

      handleStudentConnection = (channel, msg) ->
        message = JSON.parse msg
        if message.action is 'connect'
          studentConnected = true

      hasStudentConnected = () ->
        studentConnected.should.be.false
        sub.removeListener 'message', handleStudentConnection

        msg = JSON.stringify disconnectStudent1
        pub.publish chnl, msg
        done()

      sub.on 'message', handleStudentConnection

      # Connect
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg

      setTimeout hasStudentConnected, 20


    it "Should connect after a teacher has connected", (done) ->
      handleConnectedStudent = (pattern, channel, msg) ->
        message = JSON.parse msg
        if message.action is 'connect' and message.studentID?
          message.studentID.should.equal student1.studentID
          channel.should.equal "databases.n1.tom3456"
          sub.removeListener 'pmessage', handleConnectedStudent

          chnl = "teachers.n1." + teacher1.teacherID

          msg = JSON.stringify disconnectStudent1
          pub.publish chnl, msg

          msg = JSON.stringify disconnectTeacher1
          pub.publish chnl, msg
          done()

      sub.on 'pmessage', handleConnectedStudent

      # Connect teacher
      chnl = "teachers.n1." + teacher1.teacherID
      msg = JSON.stringify connectTeacher1
      pub.publish chnl, msg

      # Connect student
      chnl = "teachers.n1." + teacher1.teacherID
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg

    it "Should let student connect, then teacher connects, then student joins class", (done) ->
      #student connects1
      #teacher connects
      #student is then connected to teacher
      done()    


  describe "Lecture State", () ->
    chnl = "teachers.n1." + teacher1.teacherID

    before (done) ->
      # Connect teacher  
      msg = JSON.stringify connectTeacher1
      pub.publish chnl, msg
      done()

    after (done) ->
      msg = JSON.stringify disconnectTeacher1
      pub.publish chnl, msg
      done()

    it "Should be broadcast to one teacher, with 0 students", (done) ->
      sub.subscribe teacher1.teacherID
      statesReceived = 0

      handleLectureState = (channel, msg) ->
        message = JSON.parse msg

        if message.action is 'lecture state'
          message.numStudents.should.equal 0
          statesReceived += 1
          if statesReceived is 3
            sub.removeListener 'message', handleLectureState
            done()

      sub.on 'message', handleLectureState
      

    it "Should handle the same teacher connected twice, with 0 students", (done) ->
      sub.subscribe teacher1.teacherID

      # Connect the same teacher twice
      chnl = "teachers.n1." + teacher1.teacherID
      msg = JSON.stringify connectTeacher1
      pub.publish chnl, msg

      statesReceived = 0

      messageHandler = (channel, msg) ->

        message = JSON.parse msg

        if message.action is 'lecture state'
          message.numStudents.should.equal 0
          statesReceived += 1

          if statesReceived is 1
            #disconnect one instance of teacher
            msg = JSON.stringify disconnectTeacher1
            pub.publish chnl, msg
          else
            sub.removeListener 'message', messageHandler
            done()


      sub.on 'message', messageHandler
      

    it "Should be broadcast to one teacher with 1 student", (done) ->
      sub.subscribe teacher1.teacherID

      # Connect student
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg   # First time

      messageHandler = (channel, msg) ->

        message = JSON.parse msg

        if message.action is 'lecture state'
          message.numStudents.should.equal 1

          msg = JSON.stringify disconnectStudent1
          pub.publish chnl, msg

          sub.removeListener 'message', messageHandler
          done()


      sub.on 'message', messageHandler

    it "Should connect the same student twice and then disconnect them", (done) ->
      sub.subscribe teacher1.teacherID

      # Connect student
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg   # First time
      pub.publish chnl, msg   # Second time

      disconnected = (channel, msg) ->
        message = JSON.parse msg

        if message.numStudents is 0
          sub.removeListener 'message', disconnected

          done()
        else
          message.numStudents.should.be.below 2

      sub.on 'message', disconnected
                
      msg = JSON.stringify disconnectStudent1

      pub.publish chnl, msg
      pub.publish chnl, msg



    it "Should broadcast levels of confusion", (done) ->
      sub.subscribe teacher1.teacherID

      # Connect student
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg   # First time


      disconnected = (channel, msg) ->
        message = JSON.parse msg

        if message.confusion < 98 and message.confusion > 0
          sub.removeListener 'message', disconnected

          msg = JSON.stringify disconnectStudent1
          pub.publish chnl, msg
          done()

      sub.on 'message', disconnected
      msg = JSON.stringify confusedStudent1
      pub.publish chnl, msg
      

    it "Should broadcast levels of understanding", (done) ->
      sub.subscribe teacher1.teacherID

      # Connect student
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg   # First time

      disconnected = (channel, msg) ->
        message = JSON.parse msg

        if message.understanding < 98 and message.understanding > 0
          sub.removeListener 'message', disconnected

          msg = JSON.stringify disconnectStudent1
          pub.publish chnl, msg
          done()

      sub.on 'message', disconnected
      msg = JSON.stringify understoodStudent1
      pub.publish chnl, msg

    it "Should broadcast comprehension to students after settings update", (done) ->
      studentChannel = "#{teacher1.teacherID}.students"

      sub.subscribe teacher1.teacherID
      sub.subscribe studentChannel 

      # Connect student
      msg = JSON.stringify connectStudent1
      pub.publish chnl, msg   

      handleMessage = (channel, msg) ->
        message = JSON.parse msg

        if channel is studentChannel
          message.confusion.should.be.above 60
          message.understanding.should.equal 0
          pub.removeListener 'message', handleMessage
          done()
        else
          if message.confusion < 98 and message.confusion > 0
            #teacher updates their settings
            msg = JSON.stringify settingsTeacher1
            pub.publish chnl, msg
            
      sub.on 'message', handleMessage
      msg = JSON.stringify confusedStudent1
      pub.publish chnl, msg      
      
        


          



