function getQueryParams() {
    let params = {};
    let queryString = window.location.search.slice(1);
    let queryArray = queryString.split('&');
    queryArray.forEach(function(param) {
        let [key, value] = param.split('=');
        params[key] = decodeURIComponent(value);
    });
    return params;
}

async function getData(id) {
    try {
        const response = await fetch('../data/series.json');
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        const data = await response.json();
        return data[id];
    } catch (error) {
        console.error('Error fetching:', error);
        throw error;
    }
}

const template = document.querySelector('template#episode');
const watchWarning = document.querySelector('template#watchWarning');
const option = document.querySelector('template#option');

const logo = document.getElementById('logo');
const description = document.getElementById('description');
const information = document.getElementById('information');

const background = document.getElementById('background');
const mobileBackground = document.getElementById('mobileBackground');
const tabs = document.getElementById('tabs');
const episodes = document.getElementById('episodes');
const subscription = document.getElementById('subscription');
const buy = document.getElementById('buy');
const removed = document.getElementById('removed');
const selector = document.getElementById('season-selector');
const buttons = document.getElementById('buttons');

let data = {
    watched: false,
    params: getQueryParams(),
};
(async () => {
    if (data.params.id) {
        data.params.id = parseInt(data.params.id) - 1;
        console.log(data.params.id);
    } else {
        console.log("No name provided");
        data.params.id = 3;
    }
    data.serie = await getData(data.params.id);
    setPage(1);
})()

async function checkIfWatched() {
    let watchData = JSON.parse(localStorage.getItem("watchedListLibrary6"));
    if (watchData && Object.keys(watchData).length > 0) {
        watchData.forEach((element) => {
            if (element.name === data.serie.name) {
                data.watched = true;
                const buttons = document.getElementById('buttons');
                const watchedButton = buttons.querySelector('.watched');
                watchedButton.querySelector("p").textContent = "Watched";
                watchedButton.querySelector('use').setAttribute('href', "../assets/img/icons/check.svg#check-icon");
            }
        });
    }
}

function checkImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve(true);
        };
        img.onerror = () => {
            resolve(false);
        };
        img.src = url;
    });
}

function loadWarnings(element, episodeDiv) {
    let extraWarns = {};
    if (element.extra) {
        if (element.extra.cliff) {
            extraWarns.cliff = element.extra.cliff;
        }
        if (element.extra.deaths) {
            extraWarns.deaths = element.extra.deaths;
        }
    }
    if (Object.keys(extraWarns).length > 0) {
        const tooltipContainer = document.createElement('div');
        tooltipContainer.classList.add('tooltip-container');
        
        const warningText = document.createElement('div');
        warningText.classList.add('tooltip-text');
        if (extraWarns.cliff) {
            const warningImg = watchWarning.content.cloneNode(true);
            warningImg.querySelector('use').setAttribute('href', `../assets/img/icons/cliff.svg#icon`);
            warningImg.querySelector('svg').classList.add(extraWarns.cliff.type);
            tooltipContainer.appendChild(warningImg);

            cliffText = document.createElement('div');
            cliffText.innerHTML = `<h3 class="m-0">${extraWarns.cliff.type} cliffhanger:</h3> ${extraWarns.cliff.text == undefined?  "No text provided" : extraWarns.cliff.text}`;  
            warningText.appendChild(cliffText);
        }
        
        if (extraWarns.deaths) {
            const warningImg = watchWarning.content.cloneNode(true);
            warningImg.querySelector('use').setAttribute('href', `../assets/img/icons/death.svg#icon`);
            warningImg.querySelector('svg').classList.add(extraWarns.deaths.type);
            tooltipContainer.appendChild(warningImg);
        
            deathText = document.createElement('div');
            deathText.innerHTML += `<h3 class="m-0">${extraWarns.deaths.type} character(s) death:</h3>${extraWarns.deaths.text == undefined?  "No text provided" : extraWarns.deaths.text}`;
            warningText.appendChild(deathText);
        }
        tooltipContainer.appendChild(warningText);
        episodeDiv.querySelector('#icons').appendChild(tooltipContainer);
        return tooltipContainer;
    }
}

function setEpisodes(value) {
    episodes.innerHTML = "";
    const url = data.serie.background || `../assets/${data.serie.type}/${data.serie.name}/background/${value}.png`;
    document.documentElement.style.setProperty('--backgroundImage', `url(${new URL(url, window.location.href)})`);
    for (let i = 0; i < data.serie.seasons[value - 1].episodes.length; i++) {
        const element = data.serie.seasons[value - 1].episodes[i];
        const episodeDiv = template.content.cloneNode(true);
        episodeDiv.querySelector('#title').textContent = element.title;
        episodeDiv.querySelector('#description').textContent = element.description;
        const url = `../assets/${data.serie.type}/${data.serie.name}/episodes/${data.watched}/${value}/${element.episode}.jpg`;
        episodeDiv.querySelector('#image').src = url;
        episodeDiv.querySelector('#duration').innerHTML = `<span>${element.duration}</span> min`;
        episodeDiv.querySelector('#number').innerHTML = `E${element.episode}`;
        if (data.watched) {
            loadWarnings(element, episodeDiv);
        }
        episodes.appendChild(episodeDiv);
    }
}


async function setPage(season) {
    season = data.params.season || season;
    information.innerHTML = "";
    buy.innerHTML = "<h2>Buy on:</h2>";
    subscription.innerHTML = "<h2>Subscription:</h2>";
    removed.innerHTML = "<h2>Used to be on:</h2>";
    selector.innerHTML = "";
    checkIfWatched();
    for (let i = 0; i < data.serie.seasons.length; i++) {
        const optionClone = option.content.cloneNode(true);
        optionClone.querySelector('option').textContent = `Season ${i + 1}`;
        optionClone.querySelector('option').value = i + 1
        selector.appendChild(optionClone);
    }
    selector.value = season || 1;
    const logoUrl = `../assets/${data.serie.type}/${data.serie.name}/logo/${selector.value}.png`;
    if (await checkImage(logoUrl)) {
        logo.src = logoUrl;
    } else {
        logo.src = data.serie.logo || `../assets/${data.serie.type}/${data.serie.name}/logo/default.png`;
    }
    description.textContent = data.serie.description;

    const playButton = buttons.querySelector('.play');
    const trailerButton = buttons.querySelector('.trailer');
    const watchedButton = buttons.querySelector('.watched');
    playButton.addEventListener('click', function() {
        window.open('#watch', '_top');
    });
    trailerButton.addEventListener('click', function() {
        window.open(data.serie.trailer, '_blank');
    });
    watchedButton.addEventListener('click', function() {
        if (data.watched) {
            data.watched = false;
            let watchData = JSON.parse(localStorage.getItem("watchedListLibrary6"));
            watchData = watchData.filter((element) => element.name !== data.serie.name);
            localStorage.setItem("watchedListLibrary6", JSON.stringify(watchData));
            watchedButton.querySelector("p").textContent = "Add to Watched";
            watchedButton.querySelector('use').setAttribute('href', "../assets/img/icons/plus.svg#plus-icon");
        } else {
            data.watched = true;
            const newData = {
                name: data.serie.name,
                date: new Date().toISOString(),
                seasons: data.serie.seasons.length
            };
            let watchData = localStorage.getItem("watchedListLibrary6")
            if (watchData) {
                watchData = JSON.parse(watchData);
                watchData.push(newData);
            } else {
                watchData = [newData];
            }
            localStorage.setItem("watchedListLibrary6", JSON.stringify(watchData));
            watchedButton.querySelector("p").textContent = "Watched";
            watchedButton.querySelector('use').setAttribute('href', "../assets/img/icons/check.svg#check-icon");
        }
        setEpisodes(season);
    });
    buttons.addEventListener('mouseleave', function() {
        playButton.classList.add("extended")
        trailerButton.classList.remove("extended")
        watchedButton.classList.remove("extended")
    });
    playButton.addEventListener('mouseenter', function() {
        playButton.classList.add("extended")
        trailerButton.classList.remove("extended")
        watchedButton.classList.remove("extended")
    });
    trailerButton.addEventListener('mouseenter', function() {
        playButton.classList.remove("extended")
        trailerButton.classList.add("extended")
        watchedButton.classList.remove("extended")
    });
    watchedButton.addEventListener('mouseenter', function() {
        playButton.classList.remove("extended")
        trailerButton.classList.remove("extended")
        watchedButton.classList.add("extended")
    });
    const span = document.createElement('span');
    span.classList.add('age'); span.textContent = data.serie.age; information.appendChild(span);
    if (data.serie.type === "series") {
        let allEpisodes = 0;
        for (let i = 0; i < data.serie.seasons.length; i++) {
            allEpisodes += data.serie.seasons[i].episodes.length;
        }
        information.innerHTML += " | " + data.serie.genre + " | " + data.serie.startYear + " · " + data.serie.finalYear + " | " + data.serie.seasons.length + " Seasons | " + allEpisodes + " Episodes";
        setEpisodes(season);
    } else {
        information.innerHTML += " | " + data.serie.genre + " | " + data.serie.year + " <br> " + data.serie.duration;
        tabs.style.display = "none";
        episodes.style.display = "none";
    }
    for (const watchItem of data.serie.watch) {
        const watchButton = document.createElement('button');
        watchButton.classList.add('watch-button');
        watchButton.style.borderColor = watchItem.color;
        watchButton.addEventListener('click', function() {
            window.open(watchItem.link, '_blank');
        });
        const image = document.createElement('img');
        image.src = `../assets/img/watch/${watchItem.name}.png`;
        watchButton.appendChild(image);
        if (watchItem.removed) {
            watchButton.classList.add('removed-watch');
            removed.appendChild(watchButton);
            removed.style.display = "block";
        } else {
            if (watchItem.buyType === "subscription") {
                subscription.appendChild(watchButton);
                subscription.style.display = "block";
            } else if (watchItem.buyType === "buy") {
                buy.appendChild(watchButton);
                buy.style.display = "block";
            }
        }
    }
}

function resize() {
    const width = window.innerWidth;
    if (width < 799) {
        mobileBackground.id = 'background';
        background.id = '';
    } else {
        mobileBackground.id = 'mobileBackground';
        background.id = 'background';
    }
}

window.addEventListener('resize', function() {
    resize();
});
resize();

selector.addEventListener('change', function() {
    const value = selector.value;
    const url = new URL(window.location);
    url.searchParams.set('season', value);
    window.history.pushState({}, '', url);
    data.params.season = value;
    setPage(value);
});
window.scrollTo(0, 50);