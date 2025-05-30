"use client"

import type React from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Divider, Card, Badge } from "@heroui/react"

interface RulesModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" scrollBehavior="inside">
      <ModalContent className="bg-black/95 border border-gray-800 max-h-[90vh]">
        {(onClose) => (
          <>
            <ModalHeader className="text-white text-2xl">Правила игры "Мафия"</ModalHeader>
            <ModalBody className="space-y-6">
              {/* Общие правила */}
              <Card className="p-4 bg-gray-900/50 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">🎯 Цель игры</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <strong className="text-danger-400">Мафия:</strong> Устранить всех мирных жителей, оставаясь
                    незамеченными
                  </p>
                  <p>
                    <strong className="text-primary-400">Мирные жители:</strong> Вычислить и устранить всех членов мафии
                    путем голосования
                  </p>
                </div>
              </Card>

              {/* Фазы игры */}
              <Card className="p-4 bg-gray-900/50 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">⏰ Фазы игры</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Badge color="warning" size="lg">
                      День
                    </Badge>
                    <div className="text-gray-300">
                      <p className="font-semibold">30 секунд на обсуждение</p>
                      <p>
                        Все живые игроки обсуждают, кто может быть мафией. Делитесь подозрениями и анализируйте
                        поведение других игроков.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge color="danger" size="lg">
                      Голосование
                    </Badge>
                    <div className="text-gray-300">
                      <p className="font-semibold">15 секунд на голосование</p>
                      <p>
                        Каждый живой игрок голосует против того, кого считает мафией. Игрок с наибольшим количеством
                        голосов исключается.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge color="secondary" size="lg">
                      Последнее слово
                    </Badge>
                    <div className="text-gray-300">
                      <p className="font-semibold">30 секунд</p>
                      <p>Исключенный игрок может сказать последнее слово перед выбыванием из игры.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge color="default" size="lg">
                      Ночь
                    </Badge>
                    <div className="text-gray-300">
                      <p className="font-semibold">Активные роли действуют</p>
                      <p>Мафия выбирает жертву, шериф проверяет игрока, доктор защищает, любовница соблазняет.</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Роли */}
              <Card className="p-4 bg-gray-900/50 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">👥 Роли в игре</h3>
                <div className="space-y-4">
                  {/* Мирные роли */}
                  <div>
                    <h4 className="text-lg font-semibold text-primary-400 mb-2">Мирные жители</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Badge color="primary" size="sm">
                          Мирный житель
                        </Badge>
                        <p className="text-gray-300 text-sm">
                          Обычный житель города. Участвует в обсуждениях и голосованиях. Цель - вычислить мафию.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <Badge color="warning" size="sm">
                          Шериф
                        </Badge>
                        <p className="text-gray-300 text-sm">
                          Каждую ночь может проверить одного игрока и узнать его роль. Помогает мирным жителям найти
                          мафию.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <Badge color="success" size="sm">
                          Доктор
                        </Badge>
                        <p className="text-gray-300 text-sm">
                          Каждую ночь может защитить одного игрока от убийства мафии. Спасает жизни мирных жителей.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <Badge color="secondary" size="sm">
                          Любовница
                        </Badge>
                        <p className="text-gray-300 text-sm">
                          Каждую ночь соблазняет игрока, лишая его права голоса и способностей на следующий день/ночь.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Divider className="bg-gray-700" />

                  {/* Мафия */}
                  <div>
                    <h4 className="text-lg font-semibold text-danger-400 mb-2">Мафия</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Badge color="danger" size="sm">
                          Мафия
                        </Badge>
                        <p className="text-gray-300 text-sm">
                          Член преступной группировки. Знает других мафиози. Каждую ночь мафия выбирает жертву для
                          убийства.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <Badge color="danger" size="sm">
                          Дон мафии
                        </Badge>
                        <p className="text-gray-300 text-sm">
                          Глава мафии. Шериф видит его как мирного жителя. Может проверять игроков ночью, как шериф.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Стратегии */}
              <Card className="p-4 bg-gray-900/50 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">🧠 Советы и стратегии</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-primary-400 mb-2">Для мирных жителей:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                      <li>Внимательно следите за поведением других игроков</li>
                      <li>Анализируйте, кто голосует против кого</li>
                      <li>Обращайте внимание на тех, кто молчит или ведет себя подозрительно</li>
                      <li>Доверяйте проверкам шерифа, но помните про дона</li>
                      <li>Защищайте важных игроков (шериф, доктор)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-danger-400 mb-2">Для мафии:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                      <li>Ведите себя как обычные мирные жители</li>
                      <li>Не защищайте слишком активно других мафиози</li>
                      <li>Устраняйте в первую очередь шерифа и доктора</li>
                      <li>Создавайте подозрения против мирных жителей</li>
                      <li>Координируйтесь с командой в мафия-чате</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Условия победы */}
              <Card className="p-4 bg-gray-900/50 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">🏆 Условия победы</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <strong className="text-danger-400">Мафия побеждает:</strong> Когда количество мафиози становится
                    равным или больше количества мирных жителей
                  </p>
                  <p>
                    <strong className="text-primary-400">Мирные жители побеждают:</strong> Когда все члены мафии
                    устранены
                  </p>
                </div>
              </Card>

              {/* Особенности онлайн-игры */}
              <Card className="p-4 bg-gray-900/50 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-3">🌐 Особенности онлайн-игры</h3>
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>• Игра с ботами: боты автоматически участвуют в обсуждениях и голосованиях</p>
                  <p>• Тестовый режим: видны все роли игроков для изучения механик</p>
                  <p>• Таймеры: автоматический переход между фазами по истечении времени</p>
                  <p>• Чат мафии: отдельный канал связи для координации действий мафии</p>
                  <p>• Эффекты любовницы: соблазненные игроки теряют возможности на следующий ход</p>
                </div>
              </Card>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" onPress={onClose} size="lg">
                Понятно, начинаем играть!
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
