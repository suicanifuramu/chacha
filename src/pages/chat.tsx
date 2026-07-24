import { useCallback, useMemo, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { releasePinnedUrls } from "@/lib/image-cache"
import { deleteFromCacheAPI } from "@/lib/cache-db"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"
import { RecommendPanel } from "@/components/chat/recommend-panel"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatStatusBar } from "@/components/chat/chat-status-bar"
import { DeleteModeOverlay } from "@/components/chat/delete-mode-overlay"
import { ChatOverlays } from "@/components/chat/chat-overlays"

import { useChatRecommend } from "@/hooks/use-chat-recommend"
import { useChatDeleteMode } from "@/hooks/use-chat-delete-mode"
import { useChatCandidates } from "@/hooks/use-chat-candidates"
import { useChatScroll } from "@/hooks/use-chat-scroll"
import { useChatMessages } from "@/hooks/use-chat-messages"
import { useChatRoomInfo } from "@/hooks/use-chat-room-info"
import { useChatProfile } from "@/hooks/use-chat-profile"
import { useChatInput } from "@/hooks/use-chat-input"
import { useChatDialogs } from "@/hooks/use-chat-dialogs"
import { useChatBodyLock } from "@/hooks/use-chat-body-lock"
import { useChatActions } from "@/hooks/use-chat-actions"
import type { RuntimeMessage } from "@/lib/types"

export function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Chacha Chat"
  }, [])

  const {
    plotName,
    plotImg,
    headerSub,
    charAvatars,
    setCharAvatars,
    characters,
    plotId,
    setPlotId,
    introContent,
    statuses,
    roomImageUrls,
  } = useChatRoomInfo(roomId)
  const {
    plotDetailOpen,
    setPlotDetailOpen,
    plotDetailData,
    characterDetailOpen,
    setCharacterDetailOpen,
    selectedCharacter,
    changeProfileSheetOpen,
    setChangeProfileSheetOpen,
    changeProfileList,
    changePlotProfiles,
    changeProfileLoading,
    changeProfileInitialId,
    exitConfirmOpen,
    setExitConfirmOpen,
    resetConfirmOpen,
    setResetConfirmOpen,
    handleAvatarTap,
    handleUserMessageTap,
    handleChangeProfile,
    handleChangeProfileSelect,
    handleChangePlotProfileSelect,
    handleCreateChangeProfile,
    handleProfileUpdated: handleChangeProfileUpdated,
    handleHeaderClick,
  } = useChatDialogs({ roomId, plotId, setPlotId, characters })
  const { releaseBodyLock } = useChatBodyLock()

  // Late-binding refs
  const chatRefs = useRef<{
    scrollToBottom?: () => void
    getViewport?: () => HTMLElement | null
    setMessages?: React.Dispatch<React.SetStateAction<RuntimeMessage[]>>
  }>({})

  const {
    recItems,
    recVisible,
    setRecVisible,
    recQuota,
    recPage,
    setRecPage,
    recLoading,
    loadRecommendations,
    clearRecItems,
  } = useChatRecommend(roomId)
  const {
    needsInit,
    profileSheetOpen,
    setProfileSheetOpen,
    profileList,
    profileLoading,
    plotChatProfiles,
    onEmptyRoomDetected,
    handleProfileSelect,
    handlePlotProfileSelect,
    handleCreateProfile,
    handleProfileUpdated,
  } = useChatProfile({
    roomId,
    plotId,
    setPlotId,
    setCharAvatars,
    chatRefs,
  })
  const {
    messages,
    loading,
    sending,
    loadingHistory,
    hasMoreHistory,
    streamContents,
    setMessages,
    loadOlderMessagesRef,
    sendMessage: sendChatMessage,
  } = useChatMessages(roomId, {
    chatRefs,
    onEmptyRoomDetected,
    onClearRecommendations: clearRecItems,
  })
  const {
    deleteMode,
    selectedMsgId,
    setSelectedMsgId,
    deleting,
    handleDeleteMessages,
    exitDeleteMode,
    enterDeleteMode,
  } = useChatDeleteMode(roomId, messages, setMessages)
  const {
    candidatesCache,
    regenMsgId,
    regenContents,
    lastSwipeDirection,
    handleRegen,
    handleSwitchCandidate,
  } = useChatCandidates(roomId, messages, setMessages, chatRefs)
  const {
    containerRef,
    scrollRef,
    topSentinelRef,
    scrollToBottom,
    smoothScrollToBottom,
    showScrollBottom,
    getViewport,
  } = useChatScroll({
    roomId,
    loading,
    messagesLength: messages.length,
    regenMsgId,
    loadOlderMessagesRef,
  })

  // Bind refs
  chatRefs.current.scrollToBottom = scrollToBottom
  chatRefs.current.getViewport = getViewport

  const isRegenerating = regenMsgId !== null

  const currentStatuses = useMemo(() => {
    const lastBotMsg = [...messages]
      .reverse()
      .find((m) => m.sender?.type === "BOT")
    if (!lastBotMsg) return statuses
    const activeId = lastBotMsg.candidateId || lastBotMsg.primaryCandidateId
    const activeCandidate =
      activeId
        ? lastBotMsg.candidates?.find((c) => c.id === activeId) ||
          lastBotMsg.candidates?.[0]
        : lastBotMsg.candidates?.[0]
    const statusMap = activeCandidate?.status
    if (!statusMap) return statuses
    return statuses.map((s) => ({
      ...s,
      defaultValue: statusMap[s.key] ?? s.defaultValue,
    }))
  }, [messages, statuses])
  const {
    inputValue,
    setInputValue,
    editingMsg,
    setEditingMsg,
    inputRef,
    sendMessage,
    handleEditMessage,
    insertAsterisk,
  } = useChatInput({
    roomId,
    sending,
    regenerating: isRegenerating,
    sendChatMessage,
    scrollToBottom,
    clearRecItems,
    setRecVisible,
  })
  const handleResetConfirmOpen = useCallback(
    () => setResetConfirmOpen(true),
    [setResetConfirmOpen]
  )

  const { handleRoomReset, longPressHandlers } = useChatActions({
    plotId,
    roomId,
    navigate,
    releaseBodyLock,
    deleteMode,
    exitDeleteMode,
    enterDeleteMode,
    onResetConfirmOpen: handleResetConfirmOpen,
  })

  useEffect(() => {
    return () => {
      const released = releasePinnedUrls(roomImageUrls)
      deleteFromCacheAPI(released)
    }
  }, [roomImageUrls, roomId])

  const handleExitRoom = useCallback(() => {
    const released = releasePinnedUrls(roomImageUrls)
    deleteFromCacheAPI(released)
  }, [roomImageUrls])

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background"
    >
      <ChatHeader
        plotName={plotName}
        plotImg={plotImg}
        headerSub={headerSub}
        deleteMode={deleteMode}
        exitConfirmOpen={exitConfirmOpen}
        onExitConfirmChange={setExitConfirmOpen}
        resetConfirmOpen={resetConfirmOpen}
        onResetConfirmChange={setResetConfirmOpen}
        roomId={roomId}
        onLongPressHandlers={longPressHandlers}
        onHeaderClick={handleHeaderClick}
        onResetRoom={handleRoomReset}
        releaseBodyLock={releaseBodyLock}
        onExitRoom={handleExitRoom}
        onProfileClick={handleChangeProfile}
      />

      <ChatStatusBar statuses={currentStatuses} />

      <MessageList
        scrollRef={scrollRef}
        topSentinelRef={topSentinelRef}
        messages={messages}
        loading={loading}
        loadingHistory={loadingHistory}
        hasMoreHistory={hasMoreHistory}
        deleteMode={deleteMode}
        selectedMsgId={selectedMsgId}
        regenMsgId={regenMsgId}
        streamContents={streamContents}
        regenContents={regenContents}
        charAvatars={charAvatars}
        candidatesCache={candidatesCache}
        lastSwipeDirection={lastSwipeDirection}
        showScrollBottom={showScrollBottom}
        onSmoothScrollToBottom={smoothScrollToBottom}
        onAvatarTap={handleAvatarTap}
        onUserMessageTap={() => {
          void handleUserMessageTap()
        }}
        streaming={streamContents !== null || isRegenerating}
        onRegen={handleRegen}
        onSwitchCandidate={handleSwitchCandidate}
        onEditMessage={handleEditMessage}
        onSelectMsgForDelete={setSelectedMsgId}
        introContent={needsInit ? introContent : null}
        profileSheetOpen={profileSheetOpen}
      />

      <DeleteModeOverlay
        deleteMode={deleteMode}
        selectedMsgId={selectedMsgId}
        deleting={deleting}
        onDelete={handleDeleteMessages}
        onCancel={exitDeleteMode}
      />

      <RecommendPanel
        recVisible={recVisible}
        recItems={recItems}
        recPage={recPage}
        recLoading={recLoading}
        recQuota={recQuota}
        onPageChange={setRecPage}
        onLoadRecommendations={loadRecommendations}
        onSelectItem={(text) => {
          setInputValue(text)
          setRecVisible(false)
          inputRef.current?.focus()
        }}
      />

      <ChatInput
        ref={inputRef}
        inputValue={inputValue}
        onInputChange={setInputValue}
        sending={sending || isRegenerating}
        recVisible={recVisible}
        onToggleRecommend={() => {
          setRecVisible((v) => !v)
          if (!recVisible && recItems.length === 0) loadRecommendations()
        }}
        onSend={sendMessage}
        onInsertAsterisk={insertAsterisk}
        editingMsg={editingMsg}
        onCancelEdit={() => {
          setEditingMsg(null)
          setInputValue("")
        }}
        needsInit={needsInit}
        onOpenProfileSheet={() => setProfileSheetOpen(true)}
        profileSheetOpen={profileSheetOpen}
      />

      <ChatOverlays
        plotId={plotId}
        profileSheetOpen={profileSheetOpen}
        setProfileSheetOpen={setProfileSheetOpen}
        profileList={profileList}
        plotChatProfiles={plotChatProfiles}
        profileLoading={profileLoading}
        handleProfileSelect={handleProfileSelect}
        handlePlotProfileSelect={handlePlotProfileSelect}
        handleCreateProfile={handleCreateProfile}
        plotDetailData={plotDetailData}
        plotDetailOpen={plotDetailOpen}
        setPlotDetailOpen={setPlotDetailOpen}
        currentStatuses={currentStatuses}
        selectedCharacter={selectedCharacter}
        characterDetailOpen={characterDetailOpen}
        setCharacterDetailOpen={setCharacterDetailOpen}
        changeProfileSheetOpen={changeProfileSheetOpen}
        setChangeProfileSheetOpen={setChangeProfileSheetOpen}
        changeProfileList={changeProfileList}
        changePlotProfiles={changePlotProfiles}
        changeProfileLoading={changeProfileLoading}
        changeProfileInitialId={changeProfileInitialId}
        handleChangeProfileSelect={handleChangeProfileSelect}
        handleChangePlotProfileSelect={handleChangePlotProfileSelect}
        handleCreateChangeProfile={handleCreateChangeProfile}
        handleProfileUpdated={handleProfileUpdated}
        handleChangeProfileUpdated={handleChangeProfileUpdated}
      />
    </div>
  )
}
