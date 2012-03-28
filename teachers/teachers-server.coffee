redis   = require 'redis'

Teacher = require('./teacher').teacher


class TeachersServer
  constructor: () ->
    @teachers = {}

  start: (cb) ->
    @pubConnected = no
    @subConnected = no
    @pub = redis.createClient()
    @sub = redis.createClient()

    @pub.on 'connect', () =>
      @pubConnected = yes
      if @pubConnected and @subConnected
        @subscribe()
        cb()

    @sub.on 'connect', () =>
      @subConnected = yes
      if @pubConnected and @subConnected
        @subscribe()
        cb()

  subscribe: () ->
    @sub.psubscribe "teachers.n1.*"
  
    @sub.on 'pmessage', (pattern, channel, msg) =>
      cnParts = channel.split('.')
      teacherID = cnParts[cnParts.length - 1]
      message = JSON.parse msg

      if message.action is 'connect'
        @newConnection message, teacherID

      else if message.action is 'disconnect'
        @disconnection message, teacherID
      else
        if @teachers[teacherID]?
          @teachers[teacherID].receive message

  disconnection: (message, teacherID) ->
    if @teachers[teacherID]?
      if message.studentID?
        # A Student disconnects
        @teachers[teacherID].removeStudent message.studentID
      else
        # A Teacher disconnects
        @teachers[teacherID].decrementTeachers()

      if @teachers[teacherID].numTeachers is 0 and @teachers[teacherID].numStudents() is 0
        # No one is left in the class



    if message.studentID?

      if @teachers[teacherID]?
        @teachers[teacherID].removeStudent message.studentID
    else
      if @teachers[teacherID]?
        @teachers[teacherID].decrementTeachers()

        if not @teachers[teacherID].hasTeachers()

          @teachers[teacherID].disconnect()
          delete @teachers[teacherID]

          @sendMessage teacherID + ".students", { action: 'stop' }

  newConnection: (message, teacherID) ->
    channel = teacherID + ".students"
    unless @teachers[teacherID]?
      @teachers[teacherID] = new Teacher teacherID, (channel, msg) =>
        @sendMessage(channel, msg)
    
    if message.studentID?
      # A Student has connected
      @teachers[teacherID].addStudent message.studentID

    else
      # A Teacher has connected
      @teachers[teacherID].incrementTeachers()
      @sendMessage channel, { action: 'start' } if @teachers[teacherID].numTeachers is 1


  sendMessage: (channel, msg) ->
    msg = JSON.stringify msg
    @pub.publish channel, msg if @pub?

  stop: () ->
    @sub.punsubscribe()
    @sub.quit()
    @pub.quit()

exports.teachers = TeachersServer
