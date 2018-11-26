; (function ($, window, document, undefined) {

    'use strict';

    $.quiz = function (el, options) {
        var base = this;

        // Access to jQuery version of element
        base.$el = $(el);

        // Add a reverse reference to the DOM object
        base.$el.data('quiz', base);

        base.options = $.extend($.quiz.defaultOptions, options);

        var questions = base.options.questions,
            numQuestions = questions.length,
            startScreen = base.options.startScreen,
            startButton = base.options.startButton,
            homeButton = base.options.homeButton,
            resultsScreen = base.options.resultsScreen,
            gameOverScreen = base.options.gameOverScreen,
            nextButtonText = base.options.nextButtonText,
            finishButtonText = base.options.finishButtonText,
            restartButtonText = base.options.restartButtonText,
            currentQuestion = 1,
            score = 0,
            answerLocked = false;

        base.methods = {
            init: function () {
                base.methods.setup();

                $(document).on('click', startButton, function (e) {
                    e.preventDefault();
                    base.methods.start();
                });

                $(document).on('click', homeButton, function (e) {
                    e.preventDefault();
                    base.methods.home();
                });

                $(document).on('click', '.answers a', function (e) {
                    e.preventDefault();
                    base.methods.answerQuestion(this);
                });

                $(document).on('click', '#quiz-next-btn', function (e) {
                    e.preventDefault();
                    base.methods.nextQuestion();
                });

                $(document).on('click', '#quiz-finish-btn', function (e) {
                    e.preventDefault();
                    base.methods.finish();
                });

                $(document).on('click', '#quiz-restart-btn, #quiz-retry-btn', function (e) {
                    e.preventDefault();
                    base.methods.restart();
                });
            },
            setup: function () {
                var quizHtml = '';

                if (base.options.counter) {
                    quizHtml += '<div id="quiz-counter"></div>';
                }

                quizHtml += '<div id="questions">';
                $.each(questions, function (i, question) {
                    quizHtml += '<div class="question-container">';
                    quizHtml += '<p class="question">' + question.q + '</p>';
                    quizHtml += '<ul class="answers">';
                    $.each(question.options, function (index, answer) {
                        quizHtml += '<li><a href="#" data-index="' + index + '">' + answer + '</a></li>';
                    });
                    quizHtml += '</ul>';
                    quizHtml += '</div>';
                });
                quizHtml += '</div>';

                // if results screen not in DOM, add it
                if ($(resultsScreen).length === 0) {
                    quizHtml += '<div id="' + resultsScreen.substr(1) + '">';
                    quizHtml += '<p id="quiz-results"></p>';
                    quizHtml += '</div>';
                }

                quizHtml += '<div id="quiz-controls">';
                quizHtml += '<p id="quiz-response"></p>';
                quizHtml += '<div id="quiz-buttons">';
                quizHtml += '<a href="#" id="quiz-next-btn">' + nextButtonText + '</a>';
                quizHtml += '<a href="#" id="quiz-finish-btn">' + finishButtonText + '</a>';
                quizHtml += '<a href="#" id="quiz-restart-btn">' + restartButtonText + '</a>';
                quizHtml += '</div>';
                quizHtml += '</div>';

                base.$el.append(quizHtml).addClass('quiz-container quiz-start-state');

                $('#quiz-counter').hide();
                $('.question-container').hide();
                $(gameOverScreen).hide();
                $(resultsScreen).hide();
                $('#quiz-controls').hide();
            },
            start: function () {
                base.$el.removeClass('quiz-start-state').addClass('quiz-questions-state');
                $(startScreen).hide();
                $('#quiz-controls').hide();
                $('#quiz-finish-btn').hide();
                $('#quiz-restart-btn').hide();
                $('#questions').show();
                $('#quiz-counter').show();
                $('.question-container:first-child').show().addClass('active-question');
                base.methods.updateCounter();
            },
            answerQuestion: function (answerEl) {
                if (answerLocked) {
                    return;
                }
                answerLocked = true;

                var $answerEl = $(answerEl),
                    response = '',
                    selected = $answerEl.data('index'),
                    currentQuestionIndex = currentQuestion - 1,
                    correct = questions[currentQuestionIndex].correctIndex;

                if (selected === correct) {
                    $answerEl.addClass('correct');
                    response = questions[currentQuestionIndex].correctResponse;
                    score++;
                } else {
                    $answerEl.addClass('incorrect');
                    response = questions[currentQuestionIndex].incorrectResponse;
                    if (!base.options.allowIncorrect) {
                        base.methods.gameOver(response);
                        return;
                    }
                }

                $('#quiz-response').html(response);
                $('#quiz-controls').fadeIn();

                if (typeof base.options.answerCallback === 'function') {
                    base.options.answerCallback(currentQuestion, selected, questions[currentQuestionIndex]);
                }
            },
            nextQuestion: function () {
                answerLocked = false;

                $('.active-question')
                    .hide()
                    .removeClass('active-question')
                    .next('.question-container')
                    .show()
                    .addClass('active-question');

                $('#quiz-controls').hide();

                // check to see if we are at the last question
                if (++currentQuestion === numQuestions) {
                    $('#quiz-next-btn').hide();
                    $('#quiz-finish-btn').show();
                }

                base.methods.updateCounter();

                if (typeof base.options.nextCallback === 'function') {
                    base.options.nextCallback();
                }
            },
            gameOver: function (response) {
                // if gameover screen not in DOM, add it
                if ($(gameOverScreen).length === 0) {
                    var quizHtml = '';
                    quizHtml += '<div id="' + gameOverScreen.substr(1) + '">';
                    quizHtml += '<p id="quiz-gameover-response"></p>';
                    quizHtml += '<p><a href="#" id="quiz-retry-btn">' + restartButtonText + '</a></p>';
                    quizHtml += '</div>';
                    base.$el.append(quizHtml);
                }
                $('#quiz-gameover-response').html(response);
                $('#quiz-counter').hide();
                $('#questions').hide();
                $('#quiz-finish-btn').hide();
                $(gameOverScreen).show();
            },
            finish: function () {
                base.$el.removeClass('quiz-questions-state').addClass('quiz-results-state');
                $('.active-question').hide().removeClass('active-question');
                $('#quiz-counter').hide();
                $('#quiz-response').hide();
                $('#quiz-finish-btn').hide();
                $('#quiz-next-btn').hide();
                $('#quiz-restart-btn').show();
                $(resultsScreen).show();
                var resultsStr = base.options.resultsFormat.replace('%score', score).replace('%total', numQuestions);
                $('#quiz-results').html(resultsStr);

                if (typeof base.options.finishCallback === 'function') {
                    base.options.finishCallback();
                }
            },
            restart: function () {
                base.methods.reset();
                base.$el.addClass('quiz-questions-state');
                $('#questions').show();
                $('#quiz-counter').show();
                $('.question-container:first-child').show().addClass('active-question');
                base.methods.updateCounter();
            },
            reset: function () {
                answerLocked = false;
                currentQuestion = 1;
                score = 0;
                $('.answers a').removeClass('correct incorrect');
                base.$el.removeClass().addClass('quiz-container');
                $('#quiz-restart-btn').hide();
                $(gameOverScreen).hide();
                $(resultsScreen).hide();
                $('#quiz-controls').hide();
                $('#quiz-response').show();
                $('#quiz-next-btn').show();
                $('#quiz-counter').hide();
                $('.active-question').hide().removeClass('active-question');
            },
            home: function () {
                base.methods.reset();
                base.$el.addClass('quiz-start-state');
                $(startScreen).show();

                if (typeof base.options.homeCallback === 'function') {
                    base.options.homeCallback();
                }
            },
            updateCounter: function () {
                var countStr = base.options.counterFormat.replace('%current', currentQuestion).replace('%total', numQuestions);
                $('#quiz-counter').html(countStr);
            }
        };

        base.methods.init();
    };

    $.quiz.defaultOptions = {
        allowIncorrect: true,
        counter: true,
        counterFormat: '%current/%total',
        startScreen: '#quiz-start-screen',
        startButton: '#quiz-start-btn',
        homeButton: '#quiz-home-btn',
        resultsScreen: '#quiz-results-screen',
        resultsFormat: 'You got %score out of %total correct!',
        gameOverScreen: '#quiz-gameover-screen',
        nextButtonText: 'Следующий',
        finishButtonText: 'Finish',
        restartButtonText: 'Restart'
    };

    $.fn.quiz = function (options) {
        return this.each(function () {
            new $.quiz(this, options);
        });
    };
}(jQuery, window, document));


var congratulation = 'Хороший ответ';
var wrongAnswer = 'Неправильный ответ'


// found test questions and answers on this website: http://geetest.ru/tests/obschaya_informatika/list/4
var testData = {
    //resultsScreen: '#results-screen',
    //counter: false,
    //homeButton: '#custom-home',
    counterFormat: 'Question %current of %total',
    questions: [
        {
            'q': '1. Основными функциями операционной системы являются:',
            'options': [
                'вывод информации на принтер, управление ресурсами компьютера, запуск программ на выполнение',
                'разработка программ для ЭВМ, вывод информации на принтер.'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '2. К операционным системам относятся:',
            'options': [
                'MS-Office',
                'MS-Word, Word Pad, PowerPoint',
                'MS-DOS, Windows XP.'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '3. Операционная система может храниться на:',
            'options': [
                'жестком магнитном диске,  гибком системном диске',
                'в специальном DOS-каталоге, в каталоге пользователя.'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '4. Сетевые операционные системы — это:',
            'options': [
                'комплекс программ, обеспечивающих обработку, передачу и хранение данных в сети.',
                'комплекс программ для одновременной работы группы пользователей, комплекс программ, переносимых в сети с одного компьютера на другой'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '5. Файл — это:',
            'options': [
                'часть диска',
                'непрерывного пространства на диске',
                'последовательность операторов и команд.'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '6. Для своего размещения файл требует:',
            'options': [
                'непрерывного пространства на диске',
                'свободных кластеров в различных частях диска',
                'Fat-таблицы'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '7. Для обозначения файлов используют:',
            'options': [
                'имена и расширения',
                'команды операционной системы',
                'имена кластеров'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '8. При образовании имени файла можно использовать:',
            'options': [
                'цифры и специальные символы (>, <, =, пробел).',
                'буквы русского алфавита',
                ' буквы латинского алфавита и цифры'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '9. В качестве имени файла можно использовать символьное имя устройства: a)PRN, CON, NUL',
            'options': [
                'DISP, PORT',
                'MODEM, ADAPTER.'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '10. Тип (или расширени',
            'options': [
                'файла обозначается',
                'только тремя символами',
                'не более чем четырьмя символами',
                'не более чем тремя символами'
            ],
            'correctIndex': 3,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '11. Командный файл — это файл, содержащий:',
            'options': [
                'последовательность команд операционной системы',
                'системную информацию',
                'последовательность операторов языка программирования.'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '12. Текстовые файлы имеют расширение:',
            'options': [
                '.bak',
                '.txt',
                '.ехе'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '13. Расширение файла .ехе означает, что этот файл:',
            'options': [
                'командный',
                'системный',
                'выполняемый.'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '14. Шаблон имени и расширения файла — это:',
            'options': [
                'специальная форма, в которой в полях имени и расширений типа файла используются символы «+» и «-.»',
                'специальная форма, в которой в полях имени и расширений типа файла используются символы «*» и «?»',
                'специальная форма, в которой в полях имени и расширений типа файла используются символы «-» и «?».'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '15. Символ «*» в обозначении файла означает:',
            'options': [
                'любое число любых символов',
                'один произвольный символ',
                'один конкретный символ.'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '16. Имя файла в MS-DOS должно состоять:',
            'options': [
                'из не более чем 8 символов',
                'только из 8 символов',
                'из не более чем 8 символов.'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '17. Символ «?» в имени файла означает:',
            'options': [
                'любое число любых символов',
                'один произвольный символ',
                'один конкретный символ.'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '18. Путь или маршрут к файлу — это:',
            'options': [
                'последовательность имен диска и каталогов, раз деленных символом «\»',
                'последовательность операторов',
                ' перечень и последовательность имен устройств, разделенных символом «:».'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '19. Исполняемые файлы имеют расширение:',
            'options': [
                '.ехе, .bat',
                '.bas, .xls'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '20. Каталог — это:',
            'options': [
                'постоянная память',
                'место хранения имен файлов',
                'внешняя память длительного хранения'
            ],
            'correctIndex': 1,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '21. Текущий каталог — это:',
            'options': [
                'корневой каталог',
                'каталог, который находится на одной из панелей программы-оболочки',
                'каталог, с которым работают в настоящий момент времени'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '22. Для обозначения каталогов используют:',
            'options': [
                'имена и расширения',
                'имена и расширения',
                'обычные имена.'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '23. Каталоги образуют:',
            'options': [
                'иерархическую структуру',
                'сетевую структуру',
                'реляционную структуру'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '24. Обозначение гибких дисков в MS-DOS',
            'options': [
                'A',
                'C',
                'F'
            ],
            'correctIndex': 0,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },
        {
            'q': '25. Правильное обозначение файла в MS-DOS:',
            'options': [
                'ab+bcd.e',
                'abc.txtd',
                'abc.txt'
            ],
            'correctIndex': 2,
            'correctResponse': congratulation,
            'incorrectResponse': wrongAnswer
        },

    ]
};
$('#quiz').quiz(testData);