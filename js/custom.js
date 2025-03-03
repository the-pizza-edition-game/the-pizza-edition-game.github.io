/*

Custom script

This file will not be overwritten by the updater

*/

// JavaScript code
function search_animal() {
  let input = document.getElementById("searchbar").value;
  input = input.toLowerCase();
  let x = document.getElementsByClassName("animals");

  for (i = 0; i < x.length; i++) {
    if (!x[i].innerHTML.toLowerCase().includes(input)) {
      x[i].style.display = "none";
    } else {
      x[i].style.display = "block";
    }
  }
}

// 随机选择游戏并跳转
function openRandomGame() {
  // 获取页面中所有游戏链接
  const gameLinks = document.querySelectorAll('a[href^="/go/"]');

  // 如果找到游戏链接
  if (gameLinks.length > 0) {
    // 随机选择一个索引
    const randomIndex = Math.floor(Math.random() * gameLinks.length);

    // 获取随机选择的游戏链接
    const randomGameLink = gameLinks[randomIndex].href;

    // 跳转到随机游戏
    window.location.href = randomGameLink;
  }
}

// 页面加载完成后执行
document.addEventListener("DOMContentLoaded", function() {
  // 查找"Play Now"按钮
  const playNowButton = document.querySelector(".play-button");

  // 如果找到按钮，添加点击事件
  if (playNowButton) {
    playNowButton.addEventListener("click", function(e) {
      // 阻止默认行为（跳转到#games-section）
      e.preventDefault();

      // 打开随机游戏
      openRandomGame();
    });
  }
});
