"use client";

import { useMemo, useState } from "react";
import {
  type MessageChoiceNode,
  type MessageNode,
  createAudioNode,
  createChoiceNode,
  createChoiceOption,
  createImageNode,
  createSystemNode,
  createTextNode,
} from "@/lib/admin/messageEditorTypes";

type MessageBlockEditorProps = {
  value: MessageNode[];
  onChange: (next: MessageNode[]) => void;
};

function replaceAt<T>(array: T[], index: number, value: T) {
  return array.map((item, i) => (i === index ? value : item));
}

function removeAt<T>(array: T[], index: number) {
  return array.filter((_, i) => i !== index);
}

function moveItem<T>(array: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= array.length) return array;
  const cloned = [...array];
  const [item] = cloned.splice(index, 1);
  cloned.splice(nextIndex, 0, item);
  return cloned;
}

function BlockToolbar({
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      <button type="button" className="nav-link" onClick={onMoveUp}>
        ↑ 위로
      </button>
      <button type="button" className="nav-link" onClick={onMoveDown}>
        ↓ 아래로
      </button>
      <button type="button" className="nav-link" onClick={onRemove}>
        삭제
      </button>
    </div>
  );
}

function NestedEditor({
  value,
  onChange,
}: {
  value: MessageNode[];
  onChange: (next: MessageNode[]) => void;
}) {
  return (
    <div style={{ marginTop: 12, paddingLeft: 14, borderLeft: "2px solid #d7e0ec" }}>
      <MessageBlockEditor value={value} onChange={onChange} />
    </div>
  );
}

export default function MessageBlockEditor({
  value,
  onChange,
}: MessageBlockEditorProps) {
  const [selectedChoiceMap, setSelectedChoiceMap] = useState<Record<number, number>>(
    {}
  );

  const blockCount = useMemo(() => value.length, [value]);

  function addBlock(node: MessageNode) {
    onChange([...value, node]);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
<div
  style={{
    position: "sticky",
    top: 12,
    zIndex: 20,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    padding: 14,
    border: "1px solid #d7e0ec",
    borderRadius: 14,
    background: "#f8fbff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  }}
>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 0 }}
          onClick={() => addBlock(createTextNode("left"))}
        >
          상대 대사 추가
        </button>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 0 }}
          onClick={() => addBlock(createTextNode("right"))}
        >
          내 대사 추가
        </button>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 0 }}
          onClick={() => addBlock(createSystemNode())}
        >
          시스템 문구 추가
        </button>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 0 }}
          onClick={() => addBlock(createImageNode("left"))}
        >
          이미지 추가
        </button>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 0 }}
          onClick={() => addBlock(createAudioNode("left"))}
        >
          음성 추가
        </button>
        <button
          type="button"
          className="primary-button"
          style={{ marginTop: 0 }}
          onClick={() => addBlock(createChoiceNode())}
        >
          선택지 추가
        </button>
      </div>

      <div className="archive-card">
        <strong>블록 수: {blockCount}</strong>
      </div>

      {value.map((node, index) => {
        if (node.type === "text") {
          return (
            <div key={index} className="archive-card">
              <BlockToolbar
                onMoveUp={() => onChange(moveItem(value, index, -1))}
                onMoveDown={() => onChange(moveItem(value, index, 1))}
                onRemove={() => onChange(removeAt(value, index))}
              />

              <div className="form-grid">
                <label className="form-field">
                  <span>대사 방향</span>
                  <select
                    value={node.side}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          side: e.target.value as "left" | "right",
                        })
                      )
                    }
                  >
                    <option value="left">상대</option>
                    <option value="right">나</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>대사</span>
                  <textarea
                    rows={4}
                    value={node.text}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          text: e.target.value,
                        })
                      )
                    }
                  />
                </label>
              </div>
            </div>
          );
        }

        if (node.type === "system") {
          return (
            <div key={index} className="archive-card">
              <BlockToolbar
                onMoveUp={() => onChange(moveItem(value, index, -1))}
                onMoveDown={() => onChange(moveItem(value, index, 1))}
                onRemove={() => onChange(removeAt(value, index))}
              />

              <label className="form-field form-field-full">
                <span>시스템 문구</span>
                <input
                  value={node.text}
                  onChange={(e) =>
                    onChange(
                      replaceAt(value, index, {
                        ...node,
                        text: e.target.value,
                      })
                    )
                  }
                />
              </label>
            </div>
          );
        }

        if (node.type === "image") {
          return (
            <div key={index} className="archive-card">
              <BlockToolbar
                onMoveUp={() => onChange(moveItem(value, index, -1))}
                onMoveDown={() => onChange(moveItem(value, index, 1))}
                onRemove={() => onChange(removeAt(value, index))}
              />

              <div className="form-grid">
                <label className="form-field">
                  <span>방향</span>
                  <select
                    value={node.side}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          side: e.target.value as "left" | "right",
                        })
                      )
                    }
                  >
                    <option value="left">상대</option>
                    <option value="right">나</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>이미지 URL</span>
                  <input
                    value={node.url}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          url: e.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>캡션</span>
                  <input
                    value={node.caption ?? ""}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          caption: e.target.value,
                        })
                      )
                    }
                  />
                </label>
              </div>
            </div>
          );
        }

        if (node.type === "audio") {
          return (
            <div key={index} className="archive-card">
              <BlockToolbar
                onMoveUp={() => onChange(moveItem(value, index, -1))}
                onMoveDown={() => onChange(moveItem(value, index, 1))}
                onRemove={() => onChange(removeAt(value, index))}
              />

              <div className="form-grid">
                <label className="form-field">
                  <span>방향</span>
                  <select
                    value={node.side}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          side: e.target.value as "left" | "right",
                        })
                      )
                    }
                  >
                    <option value="left">상대</option>
                    <option value="right">나</option>
                  </select>
                </label>

                <label className="form-field form-field-full">
                  <span>mp3 URL</span>
                  <input
                    value={node.url}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          url: e.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="form-field">
                  <span>길이</span>
                  <input
                    value={node.duration ?? ""}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          duration: e.target.value,
                        })
                      )
                    }
                    placeholder="예: 00:07"
                  />
                </label>

                <label className="form-field form-field-full">
                  <span>대사/전사문</span>
                  <textarea
                    rows={3}
                    value={node.transcript ?? ""}
                    onChange={(e) =>
                      onChange(
                        replaceAt(value, index, {
                          ...node,
                          transcript: e.target.value,
                        })
                      )
                    }
                  />
                </label>
              </div>
            </div>
          );
        }

        const choiceNode = node as MessageChoiceNode;
        const selectedIndex = selectedChoiceMap[index] ?? 0;
        const selectedOption = choiceNode.options[selectedIndex];

        return (
          <div key={index} className="archive-card">
            <BlockToolbar
              onMoveUp={() => onChange(moveItem(value, index, -1))}
              onMoveDown={() => onChange(moveItem(value, index, 1))}
              onRemove={() => onChange(removeAt(value, index))}
            />

            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <strong>선택지 그룹</strong>
                <button
                  type="button"
                  className="primary-button"
                  style={{ marginTop: 0 }}
                  onClick={() => {
                    const nextNode: MessageChoiceNode = {
                      ...choiceNode,
                      options: [...choiceNode.options, createChoiceOption()],
                    };
                    onChange(replaceAt(value, index, nextNode));
                  }}
                >
                  선택지 추가
                </button>
              </div>

              {choiceNode.options.map((option, optionIndex) => (
                <div
                  key={option.id}
                  style={{
                    border: "1px solid #d7e0ec",
                    borderRadius: 12,
                    padding: 12,
                    background: selectedIndex === optionIndex ? "#f8fbff" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="nav-link"
                      onClick={() =>
                        setSelectedChoiceMap((prev) => ({
                          ...prev,
                          [index]: optionIndex,
                        }))
                      }
                    >
                      {selectedIndex === optionIndex ? "보고 있는 선택지" : "이 선택지 보기"}
                    </button>

                    <button
                      type="button"
                      className="nav-link"
                      onClick={() => {
                        const nextOptions = choiceNode.options.filter(
                          (_, i) => i !== optionIndex
                        );
                        const nextNode: MessageChoiceNode = {
                          ...choiceNode,
                          options: nextOptions.length ? nextOptions : [createChoiceOption()],
                        };
                        onChange(replaceAt(value, index, nextNode));
                        setSelectedChoiceMap((prev) => ({
                          ...prev,
                          [index]: 0,
                        }));
                      }}
                    >
                      선택지 삭제
                    </button>
                  </div>

                  <label className="form-field form-field-full">
                    <span>선택지 {optionIndex + 1}</span>
                    <input
                      value={option.label}
                      onChange={(e) => {
                        const nextOptions = replaceAt(choiceNode.options, optionIndex, {
                          ...option,
                          label: e.target.value,
                        });
                        onChange(
                          replaceAt(value, index, {
                            ...choiceNode,
                            options: nextOptions,
                          })
                        );
                      }}
                    />
                  </label>
                </div>
              ))}

              {selectedOption ? (
                <div
                  style={{
                    marginTop: 8,
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid #d7e0ec",
                    background: "#fcfdff",
                  }}
                >
                  <strong>
                    현재 편집 중: 선택지 {selectedIndex + 1}
                    {selectedOption.label ? ` - ${selectedOption.label}` : ""}
                  </strong>

                  <NestedEditor
                    value={selectedOption.result}
                    onChange={(nextResult) => {
                      const nextOptions = replaceAt(choiceNode.options, selectedIndex, {
                        ...selectedOption,
                        result: nextResult,
                      });

                      onChange(
                        replaceAt(value, index, {
                          ...choiceNode,
                          options: nextOptions,
                        })
                      );
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}