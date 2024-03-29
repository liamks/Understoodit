_   = require('underscore')._
redis = require('redis').createClient()

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
      @CONFUSION_HALF_LIFE = 4 * 60 * 1000

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
    return 0 if value is 0
    
    delta = Date.now() - time
    y = Math.cos( Math.PI * ( delta / @CONFUSION_HALF_LIFE) )

    if y > 0
      value = y
    else
      value = 0

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
      studentsCanSeeComprehension : yes

    @numTeachers = 0
    @questionMap = {}
    @questions = []

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


  hasStateChanged: (oldState) ->
    #not currently being used...
    numStudents = not ( oldState.numStudents is @state.numStudents )
    active = not ( oldState.active is @state.active )
    confusion = not ( oldState.confusion is @state.confusion )
    understanding = not ( oldState.understanding is @state.understanding )
    numStudents or active or confusion or understanding

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

    if @askingQuestion
      @state.questions = @questionMap
    else
      @state.questions = undefined


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

      if @askingQuestion
        #need to send the questions to student
        _.each @questions, ( question ) =>
          @send studentID, question

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

      @send @studentChannel, settings

  
  askQuestion: ( questionID ) ->
    redis.hgetall questionID, (error, result) =>
      result.action = 'question-received'
      @questionMap[questionID] = { results : [0,0,0,0,0] }
      @questions.push result
      @send @studentChannel, result

  answerQuestion: ( message ) ->
    @questionMap[message.questionID].results[ Number(message.selected)] += 1

  handleQuestions: ( message )->

    if message.subaction is 'ask-question'
      @askingQuestion = true
      @askQuestion message.questionID
    else if message.subaction is 'answer'
      @answerQuestion message

    else if message.subaction is 'done'

      @send @studentChannel, {'action' : 'question-done-student', 'questionID' : message.questionID }
    
      #wait 31 seconds to remove question, give student some extra time
      setTimeout () =>
        delete @questionMap[message.questionID]
        @questions = _.reject @questions, ( question )->
          return question.id is message.questionID 

        if @questions.length is 0
          @askingQuestion = false
      , 31 * 1000

      

  receive: (message) ->
    if message.action is 'confused'
      @confused message.studentID, message.date
    else if message.action is 'understood'
      @understood message.studentID, message.date
    else if message.action is 'settings'
      @updateSettings message
    else if message.action is 'question'
      @handleQuestions message


exports.teacher = Teacher