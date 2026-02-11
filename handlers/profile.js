module.exports = {
  name: 'profile',
  description: 'Profile menu',
  execute: async (ctx) => {
    const profileMenu = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👁️ View Profile', callback_data: 'profile_view' },
            { text: '✏️ Edit Profile', callback_data: 'profile_edit' }
          ],
          [
            { text: '⬅️ Back to Menu', callback_data: 'back_main' }
          ]
        ]
      }
    };
    await ctx.editMessageText('👤 **My Profile**\n\nManage your profile:', { parse_mode: 'Markdown', reply_markup: profileMenu.reply_markup });
  }
};