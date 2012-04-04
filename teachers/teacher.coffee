_   = require('underscore')._

class Student
  constructor: () ->
    @numTimesConnected = 1
    @active = yes

    @confusionTime = 0
    @confusion     = 0

    @understandingTime = 0
    @understanding     = 0

    if process.env.NODE_ENV is 'test'
      @CONFUSION_HALF_LIFE = 10 * 1000
    else
      @CONFUSION_HALF_LIFE = 2 * 60 * 1000

  confused: (time) ->
    @confusionTime = time
    @confusion = 1
    
    @understanding = 0
    @understandingTime = 0

  understood: (time) ->
    @understandingTime = time
    @understanding = 1

    @confusion = 0
    @confusionTime = 0

  decayFunction: (value, time) ->
    delta = Date.now() - time
    if delta > ( @CONFUSION_HALF_LIFE * 2 )
      value = 0
    else
      value = value * (1 / Math.pow( 2, delta/@CONFUSION_HALF_LIFE ))
    value

  decay: () -> 
    @confusion     = @decayFunction @confusion, @confusionTime
    @understanding = @decayFunction @understanding, @understandingTime

  comprehension: () ->
    @decay()

    output = 
      confusion: @confusion
      understanding: @understanding


class Teacher
  constructor: (@teacherID, @sendFunction) ->
    @settings =
      studentsCanSeeComprehension : no

    @numTeachers = 0

    @students = {}
    @state =
      numStudents   : 0
      active        : 0
      confusion     : 0
      understanding : 0

    @dbChannel = "databases.n1." + @teacherID
    @studentChannel = "#{@teacherID}.students"
    @teacherChannel = @teacherID

    @stateIntervalTime = if process.env.NODE_ENV is 'test' then 20 else 1000

    @interval = setInterval () =>
      state = @getLectureState()
      state.action = 'lecture state'
      @send  @teacherID, state

      if @settings.studentsCanSeeComprehension
        state2 = _.clone state
        delete state2.numStudents
        delete state2.active
        @send @studentChannel, state2

    , @stateIntervalTime 

  disconnect: () ->
    clearInterval @interval

  updateLectureState: () ->
    students = _.keys @students
    confusion = 0
    understanding = 0

    for studentID in students
      comprehension = @students[studentID].comprehension()
      confusion += comprehension.confusion
      understanding += comprehension.understanding

    n = @state.numStudents

    @state.confusion = if n is 0 then 0 else Math.ceil( (confusion / n )  * 100) 
    @state.understanding = if n is 0 then 0 else Math.ceil( (understanding / n )  * 100)

  getLectureState: () ->
    @updateLectureState()
    @state

  incrementTeachers: () ->
    @numTeachers += 1

  decrementTeachers: () ->
    @numTeachers -= 1

  numStudents: () ->
    _.keys(@students).length

  hasTeachers: () ->
    @numTeachers > 0

  addStudent: (studentID) ->

    if @students[studentID]?
      @students[studentID].numTimesConnected += 1
    else
      @students[studentID] = new Student()
      @state.numStudents += 1

      @send @dbChannel, { action: 'connect', studentID: studentID }

  removeStudent: (studentID) ->

    if @students[studentID]?

      if @students[studentID].numTimesConnected is 1

        delete @students[studentID]
        @state.numStudents -= 1
        @send @dbChannel, { action: 'disconnect', studentID: studentID }
      else
        @students[studentID].numTimesConnected -= 1



  confused: (studentID, time) ->
    @students[studentID].confused time if @students[studentID]?

  understood: (studentID, time) ->
    @students[studentID].understood time if @students[studentID]?

  send: (channel, msg) ->
    @sendFunction channel, msg

  updateSettings: (settings) ->
    a = no
    if _.isBoolean settings.studentsCanSeeComprehension
      @settings.studentsCanSeeComprehension = settings.studentsCanSeeComprehension
      a = yes
      
    if a
      #send settings to all instances of this teacher
      @send settings.teacherID, settings
      

  receive: (message) ->
    if message.action is 'confused'
      @confused message.studentID, message.date
    else if message.action is 'understood'
      @understood message.studentID, message.date
    else if message.action is 'settings'
      @updateSettings message


exports.teacher = Teacher